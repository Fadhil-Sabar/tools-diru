import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowDownToLine,
  Check,
  CircleAlert,
  Clipboard,
  Database,
  Replace,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { countSqlStatements, sqlFormatOptions, type KeywordCase, type SqlDialect, type SqlIndentation } from '@/lib/sql'
type FormatSql = typeof import('sql-formatter')['format']

const DIALECTS: Array<{ value: SqlDialect; label: string }> = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL / MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
]

const SAMPLE_SQL = `select u.id,u.name,count(o.id) as order_count,sum(o.total) as lifetime_value from users u left join orders o on o.user_id=u.id and o.status='completed' where u.created_at>=current_date-interval '90 days' group by u.id,u.name having count(o.id)>0 order by lifetime_value desc limit 25;`

export default function SqlFormatter() {
  const [input, setInput] = useState(() => localStorage.getItem('sql-formatter-input') ?? SAMPLE_SQL)
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper')
  const [indentation, setIndentation] = useState<SqlIndentation>('2')
  const [copied, setCopied] = useState(false)
  const [formatSql, setFormatSql] = useState<FormatSql | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const deferredInput = useDeferredValue(input)

  useEffect(() => {
    let active = true
    void import('sql-formatter').then((module) => {
      if (active) setFormatSql(() => module.format)
    })
    return () => { active = false }
  }, [])

  const result = useMemo(() => {
    if (!formatSql) return { output: '', error: '', loading: true }
    if (!deferredInput.trim()) return { output: '', error: '', loading: false }
    try {
      return {
        output: formatSql(deferredInput, sqlFormatOptions(dialect, keywordCase, indentation)),
        error: '',
        loading: false,
      }
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : 'Unable to format this query.', loading: false }
    }
  }, [deferredInput, dialect, formatSql, indentation, keywordCase])

  useEffect(() => localStorage.setItem('sql-formatter-input', input), [input])

  const statementCount = countSqlStatements(input)
  const outputLines = result.output ? result.output.split('\n') : []

  function openSql(event: ChangeEvent<HTMLInputElement>) {
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

  function downloadSql() {
    if (!result.output) return
    const url = URL.createObjectURL(new Blob([result.output], { type: 'application/sql' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'formatted.sql'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sql-tool">
      <section className="sql-workspace">
        <div className="sql-toolbar">
          <label><span>Dialect</span><select value={dialect} onChange={(event) => setDialect(event.target.value as SqlDialect)}>{DIALECTS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          <label><span>Keywords</span><select value={keywordCase} onChange={(event) => setKeywordCase(event.target.value as KeywordCase)}><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="preserve">Preserve</option></select></label>
          <label><span>Indentation</span><select value={indentation} onChange={(event) => setIndentation(event.target.value as SqlIndentation)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tabs">Tabs</option></select></label>
          <div className="sql-file-actions">
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}><Upload /> Open .sql</Button>
            <input ref={fileInput} hidden type="file" accept=".sql,text/plain,application/sql" onChange={openSql} />
            <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}><Trash2 /> Clear</Button>
          </div>
        </div>

        <div className="sql-grid">
          <div className="sql-panel">
            <div className="sql-panel-heading"><div><span className="side-index">01</span><h2>Query input</h2></div><span>{statementCount} statement{statementCount === 1 ? '' : 's'}</span></div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label="SQL input" placeholder="SELECT * FROM table..." />
          </div>

          <div className="sql-panel sql-output-panel">
            <div className="sql-panel-heading">
              <div><span className="side-index">02</span><h2>Formatted SQL</h2></div>
              <div className="sql-output-actions">
                <Button variant="ghost" size="sm" onClick={() => setInput(result.output)} disabled={!result.output}><Replace /> Apply</Button>
                <Button variant="ghost" size="sm" onClick={copyOutput} disabled={!result.output}>{copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy'}</Button>
                <Button variant="ghost" size="sm" onClick={downloadSql} disabled={!result.output}><ArrowDownToLine /> Save</Button>
              </div>
            </div>
            {result.error ? (
              <div className="sql-error"><CircleAlert /><div><strong>Could not format this query</strong><p>{result.error}</p></div></div>
            ) : result.output ? (
              <pre className="sql-output">{outputLines.map((line, index) => <span key={index}><i>{index + 1}</i><code>{line || ' '}</code></span>)}</pre>
            ) : (
              <div className="sql-empty"><Database /><p>{result.loading ? 'Loading dialect formatter...' : 'Formatted SQL will appear here.'}</p></div>
            )}
          </div>
        </div>

        <div className={`sql-status ${result.error ? 'invalid' : ''}`}>
          {result.error ? <CircleAlert /> : <WandSparkles />}
          <strong>{result.error ? 'Formatting stopped' : result.output ? 'Formatted automatically' : result.loading ? 'Loading formatter' : 'Waiting for a query'}</strong>
          <span>{result.error ? 'Check the query or try another dialect.' : result.output ? `${outputLines.length} lines · ${DIALECTS.find((item) => item.value === dialect)?.label}` : result.loading ? 'Preparing dialect support in your browser.' : 'Paste SQL or open a file to begin.'}</span>
        </div>
      </section>
    </div>
  )
}
