import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import {
  Bold,
  Code2,
  Columns2,
  Eye,
  FileDown,
  FilePenLine,
  Heading2,
  Italic,
  Link,
  List,
  LoaderCircle,
  Trash2,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { markdownStats, pdfOptions, prefixSelectedLines, wrapSelection, type PaperSize } from '@/lib/markdown'

type EditorView = 'write' | 'split' | 'preview'

const SAMPLE_MARKDOWN = `# A small document

Good tools stay out of the way. Write in **Markdown**, check the live preview, then export a clean PDF without uploading your work.

## What you can include

- Headings and emphasis
- Links, quotes, and lists
- Tables and code blocks
- Images from public URLs

> A focused writing surface makes finishing easier.

| Tool | Status |
| --- | --- |
| Live preview | Ready |
| PDF export | Ready |

\`\`\`js
const document = await createPdf(markdown)
\`\`\`
`

export default function MarkdownPdf() {
  const [markdown, setMarkdown] = useState(() => localStorage.getItem('markdown-pdf-input') ?? SAMPLE_MARKDOWN)
  const [title, setTitle] = useState(() => localStorage.getItem('markdown-pdf-title') ?? 'A small document')
  const [view, setView] = useState<EditorView>('split')
  const [paper, setPaper] = useState<PaperSize>('a4')
  const [exporting, setExporting] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const deferredMarkdown = useDeferredValue(markdown)

  const html = useMemo(() => {
    const rendered = marked.parse(deferredMarkdown, { gfm: true, breaks: true })
    return DOMPurify.sanitize(typeof rendered === 'string' ? rendered : '')
  }, [deferredMarkdown])

  const { words, pages } = markdownStats(markdown)

  useEffect(() => {
    localStorage.setItem('markdown-pdf-input', markdown)
    localStorage.setItem('markdown-pdf-title', title)
  }, [markdown, title])

  function replaceSelection(prefix: string, suffix: string, placeholder: string) {
    const editor = editorRef.current
    if (!editor) return
    const start = editor.selectionStart
    const end = editor.selectionEnd
    const replacement = wrapSelection(markdown, start, end, prefix, suffix, placeholder)
    setMarkdown(replacement.value)
    window.requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(replacement.selectionStart, replacement.selectionEnd)
    })
  }

  function prefixLines(prefix: string) {
    const editor = editorRef.current
    if (!editor) return
    setMarkdown(prefixSelectedLines(markdown, editor.selectionStart, editor.selectionEnd, prefix))
    window.requestAnimationFrame(() => editor.focus())
  }

  function openMarkdown(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void file.text().then((content) => {
      setMarkdown(content)
      setTitle(file.name.replace(/\.(md|markdown|txt)$/i, ''))
    })
    event.target.value = ''
  }

  async function exportPdf() {
    if (exporting) return
    const previousView = view
    setExporting(true)
    try {
      if (view === 'write') {
        setView('preview')
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())))
      }
      if (!previewRef.current) return
      const { default: html2pdf } = await import('html2pdf.js')
      await html2pdf().set(pdfOptions(title, paper)).from(previewRef.current).save()
    } finally {
      if (previousView === 'write') setView(previousView)
      setExporting(false)
    }
  }

  return (
    <div className="markdown-tool">
      <section className="markdown-workspace">
        <div className="markdown-document-bar">
          <label><span>Document title</span><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Document title" /></label>
          <div className="markdown-stats"><span>{words.toLocaleString()} words</span><span>~{pages} {pages === 1 ? 'page' : 'pages'}</span></div>
          <label className="paper-select"><span>Paper</span><select value={paper} onChange={(event) => setPaper(event.target.value as PaperSize)}><option value="a4">A4</option><option value="letter">Letter</option></select></label>
          <Button onClick={exportPdf} disabled={exporting || !markdown.trim()}>{exporting ? <LoaderCircle className="spin" /> : <FileDown />} {exporting ? 'Creating PDF' : 'Export PDF'}</Button>
        </div>

        <div className="markdown-toolbar">
          <div className="markdown-formatting" aria-label="Markdown formatting">
            <button onClick={() => replaceSelection('**', '**', 'bold text')} title="Bold"><Bold /></button>
            <button onClick={() => replaceSelection('_', '_', 'italic text')} title="Italic"><Italic /></button>
            <button onClick={() => prefixLines('## ')} title="Heading"><Heading2 /></button>
            <button onClick={() => prefixLines('- ')} title="List"><List /></button>
            <button onClick={() => replaceSelection('[', '](https://example.com)', 'link text')} title="Link"><Link /></button>
            <button onClick={() => replaceSelection('`', '`', 'code')} title="Inline code"><Code2 /></button>
          </div>
          <div className="markdown-file-actions">
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}><Upload /> Open .md</Button>
            <input ref={fileInput} hidden type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={openMarkdown} />
            <Button variant="ghost" size="sm" onClick={() => setMarkdown('')} disabled={!markdown}><Trash2 /> Clear</Button>
          </div>
          <div className="markdown-view-switch" aria-label="Workspace layout">
            <button className={view === 'write' ? 'active' : ''} onClick={() => setView('write')}><FilePenLine /><span>Write</span></button>
            <button className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}><Columns2 /><span>Split</span></button>
            <button className={view === 'preview' ? 'active' : ''} onClick={() => setView('preview')}><Eye /><span>Preview</span></button>
          </div>
        </div>

        <div className={`markdown-editor-grid view-${view}`}>
          <div className="markdown-editor-panel">
            <div className="markdown-panel-heading"><span><FilePenLine /> Markdown</span><small>Auto-saved locally</small></div>
            <textarea ref={editorRef} value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck={false} aria-label="Markdown editor" placeholder="# Start your document..." />
          </div>
          <div className="markdown-preview-panel">
            <div className="markdown-panel-heading"><span><Eye /> Page preview</span><small>{paper.toUpperCase()}</small></div>
            <div className="paper-stage">
              <article ref={previewRef} className={`pdf-page paper-${paper}`}>
                <div className="markdown-rendered" dangerouslySetInnerHTML={{ __html: html }} />
              </article>
            </div>
          </div>
        </div>

        <div className="markdown-privacy"><FileDown /><strong>PDF generated on this device</strong><span>Your Markdown and finished document are never sent to a server.</span></div>
      </section>
    </div>
  )
}
