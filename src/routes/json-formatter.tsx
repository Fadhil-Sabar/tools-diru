import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowDownToLine,
  Braces,
  Check,
  CircleAlert,
  Clipboard,
  Minimize2,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatJson, type JsonIndent, type JsonMode } from '@/lib/json'

const SAMPLE_JSON = `{
  "project": "Toolbox",
  "version": 2,
  "private": true,
  "tools": [
    { "name": "Diff viewer", "ready": true },
    { "name": "JSON formatter", "ready": true }
  ],
  "settings": {
    "theme": "system",
    "autosave": true
  }
}`

export default function JsonFormatter() {
  const [input, setInput] = useState(() => localStorage.getItem('json-formatter-input') ?? SAMPLE_JSON)
  const [mode, setMode] = useState<JsonMode>('format')
  const [indent, setIndent] = useState<JsonIndent>('2')
  const [copied, setCopied] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const result = useMemo(() => formatJson(input, mode, indent), [indent, input, mode])

  useEffect(() => {
    localStorage.setItem('json-formatter-input', input)
  }, [input])

  function loadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void file.text().then(setInput)
    event.target.value = ''
  }

  async function copyOutput() {
    if (!result.output) return
    await navigator.clipboard.writeText(result.output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  function downloadJson() {
    if (!result.output) return
    const url = URL.createObjectURL(new Blob([result.output], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'formatted.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="json-tool">
      <section className="json-workspace">
        <div className="json-toolbar">
          <div className="format-switch" aria-label="Output format">
            <button className={mode === 'format' ? 'active' : ''} onClick={() => setMode('format')}><WandSparkles /> Format</button>
            <button className={mode === 'minify' ? 'active' : ''} onClick={() => setMode('minify')}><Minimize2 /> Minify</button>
          </div>
          <label className="indent-control">
            Indentation
            <select value={indent} onChange={(event) => setIndent(event.target.value as JsonIndent)} disabled={mode === 'minify'}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </label>
          <div className="json-actions">
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}><Upload /> Open file</Button>
            <input ref={fileInput} type="file" accept=".json,application/json,text/plain" hidden onChange={loadJson} />
            <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}><Trash2 /> Clear</Button>
          </div>
        </div>

        <div className="json-grid">
          <div className="json-panel">
            <div className="json-panel-heading"><div><span className="side-index">01</span><h2>Input</h2></div><span>{new TextEncoder().encode(input).length.toLocaleString()} bytes</span></div>
            <textarea className="json-editor" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label="JSON input" placeholder="Paste JSON here..." />
          </div>

          <div className="json-panel output-panel">
            <div className="json-panel-heading">
              <div><span className="side-index">02</span><h2>Output</h2></div>
              <div className="output-actions">
                <Button variant="ghost" size="sm" onClick={copyOutput} disabled={!result.output}>{copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy'}</Button>
                <Button variant="ghost" size="sm" onClick={downloadJson} disabled={!result.output}><ArrowDownToLine /> Save</Button>
              </div>
            </div>
            {result.error ? (
              <div className="json-error"><CircleAlert /><div><strong>Invalid JSON</strong><p>{result.error}</p></div></div>
            ) : result.output ? (
              <pre className="json-output">{result.output.split('\n').map((line, index) => <span key={index}><i>{index + 1}</i><code>{line || ' '}</code></span>)}</pre>
            ) : (
              <div className="json-empty"><Braces /><p>Formatted output will appear here.</p></div>
            )}
          </div>
        </div>

        <div className={`json-status ${result.error ? 'invalid' : ''}`}>
          {result.error ? <><CircleAlert /><strong>Needs attention</strong><span>Fix the syntax error to generate output.</span></> : result.stats ? <><Check /><strong>Valid JSON</strong><span>{result.stats.keys} keys · {result.stats.values} values · {result.stats.depth} levels deep</span></> : <><Braces /><strong>Waiting for input</strong><span>Paste or open a JSON file to begin.</span></>}
        </div>
      </section>
    </div>
  )
}
