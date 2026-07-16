import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createTwoFilesPatch, diffLines } from 'diff'
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  Columns2,
  Rows3,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { diffStats, toLines } from '@/lib/diff'

type ViewMode = 'unified' | 'split'
type DiffKind = 'context' | 'addition' | 'deletion'

const SAMPLE_BEFORE = `export function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}`

const SAMPLE_AFTER = `export function greet(name: string) {
  const message = \`Hello, \${name}!\`;

  return message;
}`

export default function DiffViewer() {
  const [before, setBefore] = useState(() => localStorage.getItem('diff-viewer-before') ?? SAMPLE_BEFORE)
  const [after, setAfter] = useState(() => localStorage.getItem('diff-viewer-after') ?? SAMPLE_AFTER)
  const [view, setView] = useState<ViewMode>('unified')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [copied, setCopied] = useState(false)
  const beforeInput = useRef<HTMLInputElement>(null)
  const afterInput = useRef<HTMLInputElement>(null)
  const changes = useMemo(() => diffLines(before, after, { ignoreWhitespace }), [after, before, ignoreWhitespace])
  const stats = useMemo(() => diffStats(before, after, ignoreWhitespace), [after, before, ignoreWhitespace])
  const patch = useMemo(() => createTwoFilesPatch('before', 'after', before, after, '', ''), [after, before])

  useEffect(() => {
    localStorage.setItem('diff-viewer-before', before)
    localStorage.setItem('diff-viewer-after', after)
  }, [after, before])

  function loadFile(side: 'before' | 'after') {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      void file.text().then(side === 'before' ? setBefore : setAfter)
      event.target.value = ''
    }
  }

  async function copyPatch() {
    await navigator.clipboard.writeText(patch)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  function downloadPatch() {
    const url = URL.createObjectURL(new Blob([patch], { type: 'text/x-diff' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'changes.diff'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="diff-tool">
      <section className="workspace" aria-label="Diff inputs">
        <div className="input-grid">
          {([
            { label: 'Before', value: before, setter: setBefore, input: beforeInput, side: 'before' as const },
            { label: 'After', value: after, setter: setAfter, input: afterInput, side: 'after' as const },
          ]).map((editor, index) => (
            <div className="editor-panel" key={editor.side}>
              <div className="editor-heading"><div><span className="side-index">0{index + 1}</span><h2>{editor.label}</h2></div><Button variant="ghost" size="sm" onClick={() => editor.input.current?.click()}><Upload /> Open file</Button><input ref={editor.input} type="file" hidden onChange={loadFile(editor.side)} /></div>
              <textarea value={editor.value} onChange={(event) => editor.setter(event.target.value)} spellCheck={false} aria-label={`${editor.label} text`} />
            </div>
          ))}
        </div>
      </section>

      <section className="results" aria-label="Comparison result">
        <div className="results-topbar">
          <div className="result-title"><p className="eyebrow">Comparison</p><div className="change-counts"><span className="added">+{stats.additions}</span><span className="removed">-{stats.deletions}</span></div></div>
          <div className="result-controls">
            <label className="check-control"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /><span><Check /></span>Ignore whitespace</label>
            <div className="view-switch"><button className={view === 'unified' ? 'active' : ''} onClick={() => setView('unified')}><Rows3 /> Unified</button><button className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}><Columns2 /> Split</button></div>
            <Button variant="outline" size="sm" onClick={copyPatch}>{copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy diff'}</Button>
            <Button variant="outline" size="sm" onClick={downloadPatch}><ArrowDownToLine /> Export</Button>
          </div>
        </div>
        <div className="diff-frame">
          <div className="diff-filebar"><span>before</span><span className="arrow">→</span><span>after</span></div>
          {stats.additions === 0 && stats.deletions === 0 ? <div className="no-changes"><Check /><p><strong>Perfect match.</strong> No differences found.</p></div> : view === 'unified' ? <UnifiedDiff changes={changes} /> : <SplitDiff changes={changes} />}
        </div>
      </section>
    </div>
  )
}

function UnifiedDiff({ changes }: { changes: ReturnType<typeof diffLines> }) {
  let oldLine = 1
  let newLine = 1
  return <div className="unified-diff code-table">{changes.flatMap((change, changeIndex) => toLines(change.value).map((line, lineIndex) => {
    const kind: DiffKind = change.added ? 'addition' : change.removed ? 'deletion' : 'context'
    const currentOld = kind !== 'addition' ? oldLine++ : undefined
    const currentNew = kind !== 'deletion' ? newLine++ : undefined
    return <div className={`code-row ${kind}`} key={`${changeIndex}-${lineIndex}`}><span className="line-number">{currentOld}</span><span className="line-number">{currentNew}</span><span className="change-sign">{kind === 'addition' ? '+' : kind === 'deletion' ? '-' : ' '}</span><code>{line || ' '}</code></div>
  }))}</div>
}

function SplitDiff({ changes }: { changes: ReturnType<typeof diffLines> }) {
  let oldLine = 1
  let newLine = 1
  return <div className="split-diff code-table">{changes.flatMap((change, changeIndex) => toLines(change.value).map((line, lineIndex) => {
    const kind: DiffKind = change.added ? 'addition' : change.removed ? 'deletion' : 'context'
    const leftLine = kind !== 'addition' ? oldLine++ : undefined
    const rightLine = kind !== 'deletion' ? newLine++ : undefined
    return <div className={`split-row ${kind}`} key={`${changeIndex}-${lineIndex}`}><div className={`split-cell ${kind === 'addition' ? 'empty' : kind}`}><span className="line-number">{leftLine}</span><code>{kind === 'addition' ? ' ' : line || ' '}</code></div><div className={`split-cell ${kind === 'deletion' ? 'empty' : kind}`}><span className="line-number">{rightLine}</span><code>{kind === 'deletion' ? ' ' : line || ' '}</code></div></div>
  }))}</div>
}
