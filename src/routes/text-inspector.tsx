import { useEffect, useMemo, useState } from 'react'
import { AlignLeft, ArrowDownToLine, CaseSensitive, Check, Clipboard, Trash2, Type } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { analyzeText, transformText, type TextTransform } from '@/lib/text'

const SAMPLE_TEXT = `Small tools should feel immediate. They should open quickly, explain themselves clearly, and keep your work private.

Toolbox brings those focused utilities into one calm workspace.`

export default function TextInspector() {
  const [text, setText] = useState(() => localStorage.getItem('text-inspector-input') ?? SAMPLE_TEXT)
  const [copied, setCopied] = useState(false)

  useEffect(() => localStorage.setItem('text-inspector-input', text), [text])

  const analysis = useMemo(() => analyzeText(text), [text])

  async function copyText() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  function downloadText() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'text.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function transform(kind: TextTransform) {
    setText(transformText(text, kind))
  }

  const metrics = [
    ['Words', analysis.words], ['Characters', analysis.characters], ['Without spaces', analysis.noSpaces],
    ['Lines', analysis.lines], ['Sentences', analysis.sentences], ['Reading time', `${analysis.readingMinutes} min`],
  ]

  return (
    <div className="text-tool">
      <section className="text-workspace">
        <div className="text-toolbar">
          <div className="case-actions"><span><CaseSensitive /> Change case</span><button onClick={() => transform('upper')}>UPPER</button><button onClick={() => transform('lower')}>lower</button><button onClick={() => transform('title')}>Title Case</button><button onClick={() => transform('sentence')}>Sentence case</button></div>
          <div className="text-actions"><Button variant="ghost" size="sm" onClick={copyText} disabled={!text}>{copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy'}</Button><Button variant="ghost" size="sm" onClick={downloadText} disabled={!text}><ArrowDownToLine /> Save</Button><Button variant="ghost" size="sm" onClick={() => setText('')} disabled={!text}><Trash2 /> Clear</Button></div>
        </div>

        <div className="text-layout">
          <div className="text-editor-wrap"><div className="text-panel-heading"><span><AlignLeft /> Draft</span><small>{analysis.bytes.toLocaleString()} bytes</small></div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Start typing or paste text here..." aria-label="Text to inspect" /></div>
          <aside className="text-analysis">
            <p className="eyebrow">Live analysis</p>
            <div className="metric-grid">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
            <div className="keywords"><div><Type /><h3>Frequent words</h3></div>{analysis.keywords.length ? <ol>{analysis.keywords.map(([word, count]) => <li key={word}><span>{word}</span><i /><strong>{count}</strong></li>)}</ol> : <p>Add more text to reveal recurring words.</p>}</div>
          </aside>
        </div>
      </section>
    </div>
  )
}
