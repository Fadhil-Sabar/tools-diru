import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Bold,
  Clipboard,
  Code2,
  Columns2,
  Copy,
  Eye,
  FileDown,
  FilePlus2,
  FilePenLine,
  FolderOpen,
  Heading2,
  ImagePlus,
  Italic,
  Link,
  List,
  Save,
  Settings2,
} from 'lucide-react'

import MarkdownEditor, { type MarkdownEditorHandle } from '@/components/markdown/MarkdownEditor'
import MarkdownExportDialog from '@/components/markdown/MarkdownExportDialog'
import MarkdownSettingsDrawer from '@/components/markdown/MarkdownSettingsDrawer'
import { Button } from '@/components/ui/button'
import { clearMarkdownDraft, loadMarkdownDraft, saveMarkdownDraft } from '@/lib/markdown-draft'
import { copyMarkdown, copyRichText, printMarkdown, type PrintOptions } from '@/lib/markdown-export'
import { createImageUrlMap, inlineMarkdownImages, internalizeDataImages } from '@/lib/markdown-images'
import { DEFAULT_MARKDOWN_SETTINGS, markdownStats, pageDimensions, renderMarkdown, type MarkdownSettings } from '@/lib/markdown'

type EditorViewMode = 'write' | 'split' | 'preview'

const WELCOME_MARKDOWN = `# Welcome to Markdown PDF

Write Markdown, preview a print-ready page, and export without uploading your document.

## Rich Markdown

- **Bold**, _italic_, ~~strikethrough~~, and [links](https://example.com)
- [x] Task lists
- Tables, quotes, images, highlighted code, and math

| Feature | Status |
| --- | --- |
| Local images | Ready |
| Rich-text copy | Ready |
| Print settings | Ready |

\`\`\`ts
const privateByDefault = true
\`\`\`

Inline math: $E = mc^2$

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$
`

function loadSettings() {
  try {
    const saved = localStorage.getItem('markdown-pdf-settings-v2')
    return saved ? { ...DEFAULT_MARKDOWN_SETTINGS, ...JSON.parse(saved) as Partial<MarkdownSettings> } : DEFAULT_MARKDOWN_SETTINGS
  } catch {
    return DEFAULT_MARKDOWN_SETTINGS
  }
}

function downloadMarkdown(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = /\.(md|markdown|txt)$/i.test(fileName) ? fileName : `${fileName}.md`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MarkdownPdf() {
  const initialDraft = useRef(loadMarkdownDraft())
  const [markdown, setMarkdown] = useState(() => initialDraft.current?.content ?? localStorage.getItem('markdown-pdf-input') ?? WELCOME_MARKDOWN)
  const [fileName, setFileName] = useState(() => initialDraft.current?.fileName ?? localStorage.getItem('markdown-pdf-title')?.concat('.md') ?? 'welcome.md')
  const [dirty, setDirty] = useState(() => Boolean(initialDraft.current))
  const [showDraft, setShowDraft] = useState(() => Boolean(initialDraft.current))
  const [view, setView] = useState<EditorViewMode>(() => (localStorage.getItem('markdown-pdf-view') as EditorViewMode | null) ?? 'split')
  const [splitRatio, setSplitRatio] = useState(() => Number(localStorage.getItem('markdown-pdf-split')) || 50)
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const [imageUrls, setImageUrls] = useState(new Map<string, string>())
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const openInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const fileHandle = useRef<FileSystemFileHandle | null>(null)
  const deferredMarkdown = useDeferredValue(markdown)
  const stats = markdownStats(markdown)
  const dimensions = pageDimensions(settings.pageSize, settings.landscape)

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    let active = true
    let urls = new Map<string, string>()
    void createImageUrlMap(deferredMarkdown).then((next) => {
      if (!active) {
        next.forEach((url) => URL.revokeObjectURL(url))
        return
      }
      urls = next
      setImageUrls(next)
    })
    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [deferredMarkdown])

  const html = useMemo(() => renderMarkdown(deferredMarkdown, (id) => imageUrls.get(id) ?? null), [deferredMarkdown, imageUrls])

  useEffect(() => {
    localStorage.setItem('markdown-pdf-settings-v2', JSON.stringify(settings))
    localStorage.setItem('markdown-pdf-view', view)
    localStorage.setItem('markdown-pdf-split', String(splitRatio))
  }, [settings, splitRatio, view])

  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => saveMarkdownDraft(markdown, fileName), 2000)
    return () => window.clearTimeout(timer)
  }, [dirty, fileName, markdown])

  useEffect(() => {
    document.title = `${dirty ? '• ' : ''}${fileName} — Toolbox`
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty, fileName])

  function changeMarkdown(value: string) {
    setMarkdown(value)
    setDirty(true)
  }

  async function loadFile(file: File, handle: FileSystemFileHandle | null = null) {
    if (dirty && !window.confirm('Replace the current document and discard unsaved changes?')) return
    if (file.size > 5 * 1024 * 1024) notify('Large file loaded. Editing may feel slower.')
    if (!/\.(md|markdown|txt)$/i.test(file.name)) notify('Unexpected extension loaded as plain text.')
    const content = await internalizeDataImages(await file.text())
    setMarkdown(content)
    setFileName(file.name)
    fileHandle.current = handle
    setDirty(false)
    setShowDraft(false)
    clearMarkdownDraft()
    notify(`Opened ${file.name}`)
  }

  async function openDocument() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] } }] })
        await loadFile(await handle.getFile(), handle)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    openInput.current?.click()
  }

  function openFallback(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void loadFile(file)
    event.target.value = ''
  }

  async function writeHandle(handle: FileSystemFileHandle) {
    const writable = await handle.createWritable()
    await writable.write(await inlineMarkdownImages(markdown))
    await writable.close()
    fileHandle.current = handle
    setFileName(handle.name)
    setDirty(false)
    clearMarkdownDraft()
    notify(`Saved ${handle.name}`)
  }

  async function saveAs() {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: /\.(md|markdown|txt)$/i.test(fileName) ? fileName : `${fileName}.md`, types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] })
        await writeHandle(handle)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    downloadMarkdown(await inlineMarkdownImages(markdown), fileName)
    setDirty(false)
    clearMarkdownDraft()
    notify('Markdown downloaded.')
  }

  async function saveDocument() {
    if (fileHandle.current) await writeHandle(fileHandle.current)
    else await saveAs()
  }

  function newDocument() {
    if (dirty && !window.confirm('Create a new document and discard unsaved changes?')) return
    setMarkdown('')
    setFileName('Untitled.md')
    fileHandle.current = null
    setDirty(false)
    setShowDraft(false)
    clearMarkdownDraft()
    notify('New document created.')
  }

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        void (event.shiftKey ? saveAs() : saveDocument())
      } else if (key === 'o') {
        event.preventDefault()
        void openDocument()
      } else if (key === 'n' && event.shiftKey) {
        event.preventDefault()
        newDocument()
      }
    }
    window.addEventListener('keydown', shortcuts)
    return () => window.removeEventListener('keydown', shortcuts)
  })

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    const grid = event.currentTarget.parentElement
    if (!grid) return
    const move = (pointer: PointerEvent) => {
      const bounds = grid.getBoundingClientRect()
      setSplitRatio(Math.min(80, Math.max(20, ((pointer.clientX - bounds.left) / bounds.width) * 100)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  async function insertSelectedImages(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) await editorRef.current?.insertImages(event.target.files)
    event.target.value = ''
  }

  const previewStyle = {
    '--markdown-page-width': `${dimensions.width}mm`,
    minHeight: `${dimensions.height}mm`,
    padding: `${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm`,
    '--markdown-body-font': settings.customBodyFont || settings.bodyFont,
    '--markdown-heading-font': settings.customHeadingFont || settings.headingFont,
    '--markdown-code-font': settings.customCodeFont || settings.codeFont,
    '--markdown-font-size': `${settings.fontSize}pt`,
    '--markdown-line-height': settings.lineHeight,
    '--markdown-paragraph-space': `${settings.paragraphSpacing}px`,
  } as CSSProperties

  return (
    <div className="markdown-tool">
      <section className="markdown-workspace">
        {showDraft && <div className="markdown-draft-banner"><div><strong>Recovered an unsaved draft</strong><span>Saved {initialDraft.current ? new Date(initialDraft.current.savedAt).toLocaleString() : 'recently'}.</span></div><div><button onClick={() => setShowDraft(false)}>Keep draft</button><button onClick={() => { setMarkdown(WELCOME_MARKDOWN); setFileName('welcome.md'); setDirty(false); setShowDraft(false); clearMarkdownDraft() }}>Discard</button></div></div>}

        <div className="markdown-document-bar">
          <label><span>File name</span><input value={fileName} onChange={(event) => { setFileName(event.target.value); setDirty(true) }} aria-label="File name" /></label>
          <div className="markdown-stats"><span>{stats.words.toLocaleString()} words</span><span>{stats.readingMinutes} min read</span></div>
          <div className="markdown-document-actions"><Button variant="ghost" size="sm" onClick={newDocument}><FilePlus2 /> New</Button><Button variant="ghost" size="sm" onClick={() => void openDocument()}><FolderOpen /> Open</Button><Button variant="ghost" size="sm" onClick={() => void saveDocument()}><Save /> Save</Button><Button onClick={() => setExportOpen(true)}><FileDown /> Export</Button></div>
          <input ref={openInput} hidden type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={openFallback} />
        </div>

        <div className="markdown-toolbar">
          <div className="markdown-formatting" aria-label="Markdown formatting">
            <button onClick={() => editorRef.current?.wrap('**', '**', 'bold text')} title="Bold (Ctrl+B)"><Bold /></button>
            <button onClick={() => editorRef.current?.wrap('_', '_', 'italic text')} title="Italic (Ctrl+I)"><Italic /></button>
            <button onClick={() => editorRef.current?.prefixLines('## ')} title="Heading"><Heading2 /></button>
            <button onClick={() => editorRef.current?.prefixLines('- ')} title="List"><List /></button>
            <button onClick={() => editorRef.current?.link()} title="Link (Ctrl+K)"><Link /></button>
            <button onClick={() => editorRef.current?.wrap('`', '`', 'code')} title="Inline code"><Code2 /></button>
          </div>
          <div className="markdown-file-actions">
            <Button variant="ghost" size="sm" onClick={() => imageInput.current?.click()}><ImagePlus /> Image</Button>
            <input ref={imageInput} hidden type="file" accept="image/*" multiple onChange={insertSelectedImages} />
            <Button variant="ghost" size="sm" onClick={() => void copyMarkdown(markdown).then(() => notify('Markdown copied.')).catch(() => notify('Could not copy Markdown.'))}><Clipboard /> Copy Markdown</Button>
            <Button variant="ghost" size="sm" onClick={() => void copyRichText(markdown, settings).then(() => notify('Rich text copied.')).catch(() => notify('Could not copy rich text.'))}><Copy /> Copy rich</Button>
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}><Settings2 /> Settings</Button>
          </div>
          <div className="markdown-view-switch" aria-label="Workspace layout">
            <button className={view === 'write' ? 'active' : ''} onClick={() => setView('write')}><FilePenLine /><span>Write</span></button>
            <button className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}><Columns2 /><span>Split</span></button>
            <button className={view === 'preview' ? 'active' : ''} onClick={() => setView('preview')}><Eye /><span>Preview</span></button>
          </div>
        </div>

        <div className={`markdown-editor-grid view-${view}`} style={view === 'split' ? { gridTemplateColumns: `${splitRatio}% 6px calc(${100 - splitRatio}% - 6px)` } : undefined}>
          <div className="markdown-editor-panel"><div className="markdown-panel-heading"><span><FilePenLine /> Markdown</span><small>Paste or drop images</small></div><MarkdownEditor ref={editorRef} value={markdown} onChange={changeMarkdown} onCursorChange={(line, column) => setCursor({ line, column })} onToast={notify} /></div>
          {view === 'split' && <button className="markdown-divider" onPointerDown={startResize} aria-label="Resize editor and preview" />}
          <div className={`markdown-preview-panel ${settings.previewDark ? 'preview-dark' : ''}`}><div className="markdown-panel-heading"><span><Eye /> Page preview</span><small>{settings.pageSize} · {settings.landscape ? 'Landscape' : 'Portrait'}</small></div><div className="paper-stage"><article className="pdf-page" style={previewStyle}><div className="markdown-rendered" dangerouslySetInnerHTML={{ __html: html }} /></article></div></div>
        </div>

        <div className="markdown-status"><span><strong>{fileName}</strong>{dirty ? ' · Unsaved' : ' · Saved'}</span><span>{stats.words} words · {stats.characters} characters · {stats.readingMinutes} min</span><span>Ln {cursor.line}, Col {cursor.column}</span></div>
      </section>

      {settingsOpen && <><button className="markdown-settings-scrim" onClick={() => setSettingsOpen(false)} aria-label="Close settings" /><MarkdownSettingsDrawer settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} /></>}
      {exportOpen && <MarkdownExportDialog fileName={fileName} settings={settings} onClose={() => setExportOpen(false)} onExport={async (options: PrintOptions) => { try { await printMarkdown(markdown, settings, options); notify('Print dialog opened.') } catch (error) { notify(error instanceof Error ? error.message : 'Could not prepare PDF.') } }} />}
      {toast && <div className="markdown-toast" role="status">{toast}</div>}
    </div>
  )
}
