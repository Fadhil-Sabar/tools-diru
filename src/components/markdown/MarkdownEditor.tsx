import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view'
import { tags } from '@lezer/highlight'

import { IMAGE_REF_PREFIX, storeMarkdownImage } from '@/lib/markdown-images'

export interface MarkdownEditorHandle {
  focus: () => void
  wrap: (before: string, after: string, placeholder: string) => void
  link: () => void
  prefixLines: (prefix: string) => void
  insertImages: (files: FileList | File[]) => Promise<void>
}

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorChange: (line: number, column: number) => void
  onToast: (message: string) => void
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', background: 'var(--panel)', color: 'var(--ink)', fontSize: '13px' },
  '.cm-scroller': { fontFamily: '"IBM Plex Mono", monospace', lineHeight: '1.75' },
  '.cm-content': { padding: '1rem 0', caretColor: 'var(--rust)' },
  '.cm-line': { padding: '0 1rem' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--rust)', borderLeftWidth: '2px' },
  '.cm-gutters': { background: 'var(--secondary)', color: 'var(--muted-ink)', borderRight: '1px solid var(--rule)' },
  '.cm-activeLine, .cm-activeLineGutter': { background: 'color-mix(in oklch, var(--accent), transparent 45%)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'color-mix(in oklch, var(--rust-soft), var(--rust) 18%)' },
  '&.cm-focused': { outline: '2px solid var(--rust)', outlineOffset: '-2px' },
})

const proseHighlight = HighlightStyle.define([
  { tag: [tags.heading1, tags.heading2, tags.heading3], color: 'var(--ink)', fontWeight: '700' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: [tags.link, tags.url], color: 'var(--rust)' },
  { tag: tags.monospace, color: 'var(--pine)' },
  { tag: tags.quote, color: 'var(--muted-ink)', fontStyle: 'italic' },
  { tag: [tags.keyword, tags.operator], color: 'var(--rust)' },
  { tag: tags.string, color: 'var(--pine)' },
  { tag: tags.comment, color: 'var(--muted-ink)' },
])

function replaceSelection(view: EditorView, before: string, after: string, placeholder: string) {
  const selection = view.state.selection.main
  const selected = view.state.sliceDoc(selection.from, selection.to) || placeholder
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
    selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length },
  })
  view.focus()
}

function insertLink(view: EditorView) {
  const selection = view.state.selection.main
  const selected = view.state.sliceDoc(selection.from, selection.to) || 'link text'
  const value = `[${selected}](https://example.com)`
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: value },
    selection: { anchor: selection.from + selected.length + 3, head: selection.from + value.length - 1 },
  })
  view.focus()
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(function MarkdownEditor({ value, onChange, onCursorChange, onToast }, ref) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const valueRef = useRef(value)
  const syncingRef = useRef(false)
  const callbacksRef = useRef({ onChange, onCursorChange, onToast })
  valueRef.current = value
  callbacksRef.current = { onChange, onCursorChange, onToast }

  async function insertImages(files: FileList | File[]) {
    const view = viewRef.current
    if (!view) return
    let position = view.state.selection.main.head
    let inserted = false
    for (const file of Array.from(files)) {
      try {
        const id = await storeMarkdownImage(file, file.name)
        const alt = file.name.replaceAll('[', '').replaceAll(']', '') || 'image'
        const text = `![${alt}](${IMAGE_REF_PREFIX}${id})\n`
        view.dispatch({ changes: { from: position, insert: text } })
        position += text.length
        inserted = true
      } catch (error) {
        callbacksRef.current.onToast(error instanceof Error ? error.message : 'Could not insert image.')
      }
    }
    if (inserted) {
      callbacksRef.current.onToast('Image inserted locally.')
      view.focus()
    }
  }

  useImperativeHandle(ref, () => ({
    focus: () => viewRef.current?.focus(),
    wrap: (before, after, placeholder) => {
      if (viewRef.current) replaceSelection(viewRef.current, before, after, placeholder)
    },
    link: () => {
      if (viewRef.current) insertLink(viewRef.current)
    },
    prefixLines: (prefix) => {
      const view = viewRef.current
      if (!view) return
      const selection = view.state.selection.main
      const startLine = view.state.doc.lineAt(selection.from)
      const endLine = view.state.doc.lineAt(selection.to)
      const changes = []
      for (let line = startLine.number; line <= endLine.number; line++) changes.push({ from: view.state.doc.line(line).from, insert: prefix })
      view.dispatch({ changes })
      view.focus()
    },
    insertImages,
  }))

  useEffect(() => {
    if (!hostRef.current) return
    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        bracketMatching(),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(proseHighlight),
        editorTheme,
        EditorView.lineWrapping,
        EditorView.domEventHandlers({
          paste(event) {
            if (!event.clipboardData?.files.length) return false
            event.preventDefault()
            void insertImages(event.clipboardData.files)
            return true
          },
          drop(event, view) {
            if (!event.dataTransfer?.files.length) return false
            event.preventDefault()
            const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (position !== null) view.dispatch({ selection: { anchor: position } })
            void insertImages(event.dataTransfer.files)
            return true
          },
          dragover(event) {
            if (!event.dataTransfer?.types.includes('Files')) return false
            event.preventDefault()
            return true
          },
        }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          { key: 'Mod-b', run: (view) => { replaceSelection(view, '**', '**', 'bold text'); return true } },
          { key: 'Mod-i', run: (view) => { replaceSelection(view, '_', '_', 'italic text'); return true } },
          { key: 'Mod-k', run: (view) => { insertLink(view); return true } },
        ]),
        EditorView.updateListener.of((update) => {
           if (update.docChanged && !syncingRef.current) callbacksRef.current.onChange(update.state.doc.toString())
           syncingRef.current = false
          if (update.selectionSet || update.docChanged) {
            const position = update.state.selection.main.head
            const line = update.state.doc.lineAt(position)
            callbacksRef.current.onCursorChange(line.number, position - line.from + 1)
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      syncingRef.current = true
      view.dispatch({ changes: { from: 0, to: current.length, insert: value }, selection: { anchor: 0 } })
    }
  }, [value])

  return <div ref={hostRef} className="markdown-codemirror" aria-label="Markdown editor" />
})

export default MarkdownEditor
