import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Braces,
  Check,
  CircleAlert,
  Clipboard,
  Table2,
  Trash2,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { convertData, type DataDelimiter, type DataDirection, type JsonSpacing } from '@/lib/json-csv'

const SAMPLE_JSON = `[
  { "name": "Ada Lovelace", "role": "Engineer", "active": true },
  { "name": "Grace Hopper", "role": "Admiral", "active": true },
  { "name": "Alan Turing", "role": "Researcher", "active": false }
]`

export default function JsonCsv() {
  const [direction, setDirection] = useState<DataDirection>('json-to-csv')
  const [input, setInput] = useState(() => localStorage.getItem('json-csv-input') ?? SAMPLE_JSON)
  const [delimiter, setDelimiter] = useState<DataDelimiter>(',')
  const [jsonSpacing, setJsonSpacing] = useState<JsonSpacing>('2')
  const [inferTypes, setInferTypes] = useState(true)
  const [copied, setCopied] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const deferredInput = useDeferredValue(input)

  const result = useMemo(() => convertData(deferredInput, direction, delimiter, jsonSpacing, inferTypes), [deferredInput, delimiter, direction, inferTypes, jsonSpacing])

  useEffect(() => localStorage.setItem('json-csv-input', input), [input])

  function switchDirection(next: DataDirection) {
    if (next === direction) return
    if (result.output) setInput(result.output)
    setDirection(next)
  }

  function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void file.text().then(setInput)
    if (/\.csv$/i.test(file.name)) setDirection('csv-to-json')
    if (/\.json$/i.test(file.name)) setDirection('json-to-csv')
    event.target.value = ''
  }

  async function copyOutput() {
    if (!result.output) return
    await navigator.clipboard.writeText(result.output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  function downloadOutput() {
    if (!result.output) return
    const isCsv = direction === 'json-to-csv'
    const url = URL.createObjectURL(new Blob([result.output], { type: isCsv ? 'text/csv' : 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = isCsv ? 'converted.csv' : 'converted.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const outputLines = result.output ? result.output.split('\n') : []
  const inputLabel = direction === 'json-to-csv' ? 'JSON input' : 'CSV input'
  const outputLabel = direction === 'json-to-csv' ? 'CSV output' : 'JSON output'

  return (
    <div className="data-converter-tool">
      <section className="data-workspace">
        <div className="data-direction">
          <button className={direction === 'json-to-csv' ? 'active' : ''} onClick={() => switchDirection('json-to-csv')}><Braces /><span><strong>JSON</strong><small>source</small></span><ArrowLeftRight /><span><strong>CSV</strong><small>output</small></span><Table2 /></button>
          <button className={direction === 'csv-to-json' ? 'active' : ''} onClick={() => switchDirection('csv-to-json')}><Table2 /><span><strong>CSV</strong><small>source</small></span><ArrowLeftRight /><span><strong>JSON</strong><small>output</small></span><Braces /></button>
        </div>

        <div className="data-toolbar">
          <label><span>Delimiter</span><select value={delimiter} onChange={(event) => setDelimiter(event.target.value as DataDelimiter)}><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="\t">Tab</option></select></label>
          {direction === 'csv-to-json' && <label><span>JSON style</span><select value={jsonSpacing} onChange={(event) => setJsonSpacing(event.target.value as JsonSpacing)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="compact">Compact</option></select></label>}
          {direction === 'csv-to-json' && <label className="data-check"><input type="checkbox" checked={inferTypes} onChange={(event) => setInferTypes(event.target.checked)} /><span><Check /></span>Infer numbers and booleans</label>}
          <div className="data-file-actions"><Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}><Upload /> Open file</Button><input ref={fileInput} hidden type="file" accept=".json,.csv,application/json,text/csv,text/plain" onChange={openFile} /><Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}><Trash2 /> Clear</Button></div>
        </div>

        <div className="data-grid">
          <div className="data-panel">
            <div className="data-panel-heading"><div><span className="side-index">01</span><h2>{inputLabel}</h2></div><span>{new TextEncoder().encode(input).length.toLocaleString()} bytes</span></div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label={inputLabel} placeholder={direction === 'json-to-csv' ? '[{"name":"Ada"}]' : 'name,role\nAda,Engineer'} />
          </div>
          <div className="data-panel">
            <div className="data-panel-heading"><div><span className="side-index">02</span><h2>{outputLabel}</h2></div><div className="data-output-actions"><Button variant="ghost" size="sm" onClick={copyOutput} disabled={!result.output}>{copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy'}</Button><Button variant="ghost" size="sm" onClick={downloadOutput} disabled={!result.output}><ArrowDownToLine /> Save</Button></div></div>
            {result.error ? <div className="data-error"><CircleAlert /><div><strong>Conversion stopped</strong><p>{result.error}</p></div></div> : result.output ? <pre className="data-output">{outputLines.map((line, index) => <span key={index}><i>{index + 1}</i><code>{line || ' '}</code></span>)}</pre> : <div className="data-empty"><ArrowLeftRight /><p>Converted data will appear here.</p></div>}
          </div>
        </div>

        <div className={`data-status ${result.error ? 'invalid' : ''}`}><span>{result.error ? <CircleAlert /> : <Check />}</span><strong>{result.error ? 'Check your source data' : result.output ? 'Conversion ready' : 'Waiting for data'}</strong><small>{result.error ? 'Correct the issue above to continue.' : result.output ? `${result.rows} rows · ${result.columns} columns` : 'Paste data or open a file to begin.'}</small></div>
      </section>
    </div>
  )
}
