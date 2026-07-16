import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, Droplets, Palette, Pipette } from 'lucide-react'

import { formatCmyk, formatHsl, formatRgb, hslToRgb, parseColor, readableTextColor, rgbToHex, rgbToHsl } from '@/lib/color'

const INITIAL_COLOR = '#C45132'

export default function ColorConverter() {
  const [input, setInput] = useState(() => localStorage.getItem('color-converter-value') ?? INITIAL_COLOR)
  const [copied, setCopied] = useState('')
  const color = useMemo(() => parseColor(input), [input])

  useEffect(() => localStorage.setItem('color-converter-value', input), [input])

  function setChannel(channel: 'r' | 'g' | 'b', value: number) {
    const current = color ?? parseColor(INITIAL_COLOR)!
    setInput(rgbToHex({ ...current, [channel]: value }))
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  const formats = color ? [
    ['HEX', rgbToHex(color)],
    ['RGB', formatRgb(color)],
    ['HSL', formatHsl(color)],
    ['CMYK', formatCmyk(color)],
  ] : []
  const hsl = color ? rgbToHsl(color) : null
  const palette = hsl ? [-60, -30, 0, 30, 60, 180].map((offset) => hslToRgb({ ...hsl, h: hsl.h + offset })) : []

  return (
    <section className="color-workspace">
      <div className="color-entry">
        <div className="color-swatch" style={{ background: color ? rgbToHex(color) : 'var(--secondary)', color: color ? readableTextColor(color) : 'var(--muted-ink)' }}>
          <Pipette />
          <strong>{color ? rgbToHex(color) : 'Invalid color'}</strong>
          <span>{color ? 'Live color sample' : 'Try HEX, RGB, or HSL'}</span>
        </div>
        <div className="color-input-panel">
          <label><span>Color value</span><div><input value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} placeholder="#C45132 or rgb(196, 81, 50)" aria-invalid={!color} />{color && <input type="color" value={rgbToHex(color).slice(0, 7)} onChange={(event) => setInput(event.target.value.toUpperCase())} aria-label="Choose color" />}</div></label>
          {color ? <div className="channel-controls">{(['r', 'g', 'b'] as const).map((channel) => <label key={channel}><span>{channel.toUpperCase()} <strong>{Math.round(color[channel])}</strong></span><input type="range" min="0" max="255" value={color[channel]} onChange={(event) => setChannel(channel, Number(event.target.value))} /></label>)}</div> : <div className="color-input-error">Use formats such as <code>#C45132</code>, <code>rgb(196, 81, 50)</code>, or <code>hsl(13, 57%, 48%)</code>.</div>}
        </div>
      </div>

      {color && <>
        <div className="color-formats-heading"><div><Droplets /><span><strong>Converted values</strong><small>Click any value to copy</small></span></div><span>Alpha {Math.round(color.a * 100)}%</span></div>
        <div className="color-formats">{formats.map(([label, value]) => <button key={label} onClick={() => copyValue(label, value)}><span>{label}</span><code>{value}</code>{copied === label ? <Check /> : <Clipboard />}</button>)}</div>
        <div className="color-palette-section">
          <div className="color-formats-heading"><div><Palette /><span><strong>Related palette</strong><small>Neighboring and complementary hues</small></span></div><span>Hue {hsl?.h}°</span></div>
          <div className="related-colors">{palette.map((item, index) => { const hex = rgbToHex(item); return <button key={`${hex}-${index}`} style={{ background: hex, color: readableTextColor(item) }} onClick={() => { setInput(hex); void copyValue(`palette-${index}`, hex) }}><span>{hex}</span>{copied === `palette-${index}` && <Check />}</button> })}</div>
        </div>
      </>}
    </section>
  )
}
