import { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  Copy,
  Hash,
  RotateCw,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { clampUuidCount, formatUuid, generateUuids, joinUuids, type UuidFormat, type UuidSeparator } from '@/lib/uuid'

export default function UuidGenerator() {
  const [count, setCount] = useState(5)
  const [format, setFormat] = useState<UuidFormat>('standard')
  const [separator, setSeparator] = useState<UuidSeparator>('newline')
  const [uuids, setUuids] = useState(() => generateUuids(5))
  const [copied, setCopied] = useState('')

  const formatted = useMemo(() => uuids.map((uuid) => formatUuid(uuid, format)), [format, uuids])
  const joined = joinUuids(formatted, separator)

  function regenerate(nextCount = count) {
    const safeCount = clampUuidCount(nextCount)
    setCount(safeCount)
    setUuids(generateUuids(safeCount))
  }

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1400)
  }

  function downloadUuids() {
    const url = URL.createObjectURL(new Blob([joined], { type: 'text/plain' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `uuids-${formatted.length}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="uuid-tool">
      <section className="uuid-workspace">
        <div className="uuid-controls">
          <div className="uuid-control-group count-control">
            <label htmlFor="uuid-count">Quantity</label>
            <div>
              {[1, 5, 10, 25].map((amount) => <button className={count === amount ? 'active' : ''} key={amount} onClick={() => regenerate(amount)}>{amount}</button>)}
              <input id="uuid-count" type="number" min="1" max="100" value={count} onChange={(event) => setCount(Math.min(100, Math.max(1, Number(event.target.value))))} onBlur={() => regenerate()} aria-label="Custom UUID quantity" />
            </div>
          </div>
          <label className="uuid-control-group">
            <span>Format</span>
            <select value={format} onChange={(event) => setFormat(event.target.value as UuidFormat)}>
              <option value="standard">Standard</option>
              <option value="uppercase">Uppercase</option>
              <option value="compact">No hyphens</option>
              <option value="braces">With braces</option>
            </select>
          </label>
          <label className="uuid-control-group">
            <span>Copy separator</span>
              <select value={separator} onChange={(event) => setSeparator(event.target.value as UuidSeparator)}>
              <option value="newline">New line</option>
              <option value="comma">Comma</option>
              <option value="space">Space</option>
            </select>
          </label>
          <Button className="generate-button" onClick={() => regenerate()}><RotateCw /> Generate fresh</Button>
        </div>

        <div className="uuid-result-heading">
          <div><p className="eyebrow">Generated batch</p><span>{formatted.length} UUID{formatted.length === 1 ? '' : 's'} · version 4</span></div>
          <div>
            <Button variant="outline" size="sm" onClick={() => copyValue('all', joined)}>{copied === 'all' ? <Check /> : <Copy />} {copied === 'all' ? 'Copied all' : 'Copy all'}</Button>
            <Button variant="outline" size="sm" onClick={downloadUuids}><ArrowDownToLine /> Save</Button>
          </div>
        </div>

        <div className="uuid-list">
          {formatted.map((uuid, index) => (
            <div className="uuid-row" key={uuids[index]}>
              <span>{(index + 1).toString().padStart(2, '0')}</span>
              <Hash />
              <code>{uuid}</code>
              <button onClick={() => copyValue(uuids[index], uuid)} aria-label={`Copy UUID ${index + 1}`}>
                {copied === uuids[index] ? <Check /> : <Clipboard />}<span>{copied === uuids[index] ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="uuid-security"><ShieldCheck /><div><strong>Generated with Web Crypto</strong><p>UUIDs are created locally with your browser's secure random number generator and never leave this device.</p></div></div>
      </section>
    </div>
  )
}
