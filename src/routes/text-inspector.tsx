import { useEffect, useMemo, useState } from 'react'
import { AlignLeft, ArrowDownToLine, CaseSensitive, Check, Clipboard, Trash2, Type } from 'lucide-react'

import { Button } from '@/components/ui/button'

const SAMPLE_TEXT = `Small tools should feel immediate. They should open quickly, explain themselves clearly, and keep your work private.

Toolbox brings those focused utilities into one calm workspace.`
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'this', 'that', 'your', 'with', 'into', 'one', 'they'])

export default function TextInspector() {
  const [text, setText] = useState(() => localStorage.getItem('text-inspector-input') ?? SAMPLE_TEXT)
  const [copied, setCopied] = useState(false)

  useEffect(() => localStorage.setItem('text-inspector-input', text), [text])

  const analysis = useMemo(() => {
    const words = text.match(/[\p{L}\p{N}'’-]+/gu) ?? []
    const sentences = text.trim() ? text.split(/[.!?]+(?=\s|$)/).filter((item) => item.trim()).length : 0
    const frequencies = new Map<string, number>()
    for (const word of words) {
      const normalized = word.toLocaleLowerCase()
      if (normalized.length > 2 && !STOP_WORDS.has(normalized)) frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1)
    }
    return {
      words: words.length,
      characters: text.length,
      noSpaces: text.replace(/\s/g, '').length,
      lines: text ? text.split('\n').length : 0,
      sentences,
      bytes: new TextEncoder().encode(text).length,
      readingMinutes: words.length ? Math.max(1, Math.ceil(words.length / 200)) : 0,
      keywords: [...frequencies.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6),
    }
  }, [text])

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

  function transform(kind: 'upper' | 'lower' | 'title' | 'sentence') {
    if (kind === 'upper') setText(text.toLocaleUpperCase())
    if (kind === 'lower') setText(text.toLocaleLowerCase())
    if (kind === 'title') setText(text.toLocaleLowerCase().replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase()))
    if (kind === 'sentence') setText(text.toLocaleLowerCase().replace(/(^|[.!?]\s+)\p{L}/gu, (letter) => letter.toLocaleUpperCase()))
  }

  const metrics = [
    ['Words', analysis.words], ['Characters', analysis.characters], ['Without spaces', analysis.noSpaces],
    ['Lines', analysis.lines], ['Sentences', analysis.sentences], ['Reading time', `${analysis.readingMinutes} min`],
  ]

  return (
    <div className="text-tool">
      <section className="tool-intro">
        <div><p className="eyebrow">Text utility 04</p><h1>Know your <em>words.</em></h1></div>
        <p>Measure, inspect, and reshape text in real time. Useful for drafts, posts, metadata, and everyday writing.</p>
      </section>

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
