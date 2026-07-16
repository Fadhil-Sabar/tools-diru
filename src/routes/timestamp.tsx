import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, CircleAlert, Clipboard, RotateCw } from 'lucide-react'
import { parseTimestamp, relativeTime, timestampInUnit, toLocalDateTimeValue, type TimestampUnit } from '@/lib/timestamp'

export default function Timestamp() {
  const [unit, setUnit] = useState<TimestampUnit>('seconds')
  const [timestamp, setTimestamp] = useState(() => localStorage.getItem('timestamp-value') ?? Math.floor(Date.now() / 1000).toString())
  const [clock, setClock] = useState(Date.now())
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => localStorage.setItem('timestamp-value', timestamp), [timestamp])

  const date = useMemo(() => parseTimestamp(timestamp, unit), [timestamp, unit])

  function useNow() {
    const now = Date.now()
    setTimestamp(timestampInUnit(new Date(now), unit).toString())
  }

  function changeUnit(nextUnit: TimestampUnit) {
    if (date) setTimestamp(timestampInUnit(date, nextUnit).toString())
    setUnit(nextUnit)
  }

  function changeLocalDate(value: string) {
    const nextDate = new Date(value)
    if (!Number.isFinite(nextDate.getTime())) return
    setTimestamp(timestampInUnit(nextDate, unit).toString())
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  const outputs = date ? [
    { label: 'Local time', value: date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }) },
    { label: 'UTC', value: date.toUTCString() },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: 'Relative', value: relativeTime(date, clock) },
  ] : []

  return (
    <div className="timestamp-tool">
      <section className="time-workspace">
        <button className="live-clock" onClick={useNow}>
          <span><i /> Current Unix time</span>
          <strong>{Math.floor(clock / 1000)}</strong>
          <small>Use now <RotateCw /></small>
        </button>

        <div className="time-inputs">
          <div className="time-input-block">
            <div className="block-heading"><span className="side-index">01</span><div><h2>Unix timestamp</h2><p>Enter elapsed time since January 1, 1970.</p></div></div>
            <div className="timestamp-entry">
              <input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} inputMode="numeric" aria-label="Unix timestamp" />
              <div className="unit-switch"><button className={unit === 'seconds' ? 'active' : ''} onClick={() => changeUnit('seconds')}>Seconds</button><button className={unit === 'milliseconds' ? 'active' : ''} onClick={() => changeUnit('milliseconds')}>Milliseconds</button></div>
            </div>
          </div>
          <div className="time-input-block">
            <div className="block-heading"><span className="side-index">02</span><div><h2>Local date & time</h2><p>{Intl.DateTimeFormat().resolvedOptions().timeZone}</p></div></div>
            <label className="date-entry"><Calendar /><input type="datetime-local" step="1" value={date ? toLocalDateTimeValue(date) : ''} onChange={(event) => changeLocalDate(event.target.value)} /></label>
          </div>
        </div>

        {date ? (
          <div className="time-results">
            <div className="time-results-heading"><p className="eyebrow">Converted values</p><span>{unit === 'seconds' ? '10-digit Unix time' : '13-digit Unix time'}</span></div>
            {outputs.map((output) => <div className="time-result" key={output.label}><span>{output.label}</span><code>{output.value}</code><button onClick={() => copyValue(output.label, output.value)}>{copied === output.label ? <Check /> : <Clipboard />}<span>{copied === output.label ? 'Copied' : 'Copy'}</span></button></div>)}
          </div>
        ) : (
          <div className="time-invalid"><CircleAlert /><div><strong>Enter a valid timestamp</strong><p>Use a numeric Unix timestamp in seconds or milliseconds.</p></div></div>
        )}
      </section>
    </div>
  )
}
