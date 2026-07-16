import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ArrowDownToLine, Check, Clipboard, Copy, Info, RefreshCw, Shuffle, SwatchBook } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { readableTextColor, rgbToHex } from '@/lib/color'
import { exportPalette, generatePalette, randomSeed, type PaletteExportFormat as ExportFormat, type PaletteHarmony as Harmony } from '@/lib/palette'

const HARMONIES: Array<{ value: Harmony; label: string; description: string }> = [
  { value: 'analogous', label: 'Analogous', description: 'Neighboring hues create a calm, cohesive palette.' },
  { value: 'complementary', label: 'Complementary', description: 'Opposite hues create strong contrast and clear emphasis.' },
  { value: 'triadic', label: 'Triadic', description: 'Three evenly spaced hues feel balanced, colorful, and lively.' },
  { value: 'tetradic', label: 'Tetradic', description: 'Two complementary pairs provide variety for richer visual systems.' },
  { value: 'monochrome', label: 'Monochrome', description: 'One hue with varied lightness creates a unified tonal scale.' },
]

export default function ColorPalette() {
  const [seed, setSeed] = useState(() => localStorage.getItem('palette-seed') ?? randomSeed())
  const [count, setCount] = useState(() => Number(localStorage.getItem('palette-count')) || 5)
  const [harmony, setHarmony] = useState<Harmony>(() => (localStorage.getItem('palette-harmony') as Harmony | null) ?? 'analogous')
  const [copied, setCopied] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const colors = useMemo(() => generatePalette(seed, count, harmony), [count, harmony, seed])
  const harmonyInfo = HARMONIES.find((item) => item.value === harmony)!

  function updateSeed(event: ChangeEvent<HTMLInputElement>) {
    setSeed(event.target.value)
    localStorage.setItem('palette-seed', event.target.value)
  }

  function generateNew() {
    const newSeed = randomSeed()
    setSeed(newSeed)
    localStorage.setItem('palette-seed', newSeed)
  }

  function updateCount(value: number) {
    const clamped = Math.min(8, Math.max(3, value))
    setCount(clamped)
    localStorage.setItem('palette-count', String(clamped))
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  function updateHarmony(value: Harmony) {
    setHarmony(value)
    localStorage.setItem('palette-harmony', value)
  }

  const exportValue = useMemo(() => exportPalette(colors, exportFormat), [colors, exportFormat])

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const swatchW = 160
    const swatchH = 200
    canvas.width = swatchW * colors.length
    canvas.height = swatchH
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    colors.forEach((color, i) => {
      const hex = rgbToHex(color)
      ctx.fillStyle = hex
      ctx.fillRect(i * swatchW, 0, swatchW, swatchH)
      ctx.fillStyle = readableTextColor(color)
      ctx.font = '600 14px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(hex, i * swatchW + swatchW / 2, swatchH / 2 + 5)
    })
    const url = canvas.toDataURL('image/png')
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `palette-${seed}.png`
    anchor.click()
  }

  function downloadCode() {
    const extensions: Record<ExportFormat, string> = { css: 'css', json: 'json', tailwind: 'js', scss: 'scss' }
    const url = URL.createObjectURL(new Blob([exportValue], { type: 'text/plain' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `palette-${seed}.${extensions[exportFormat]}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="palette-tool">
      <section className="palette-workspace">
        <div className="palette-controls">
          <label className="palette-seed-input">
            <span>Seed</span>
            <div>
              <input value={seed} onChange={updateSeed} spellCheck={false} placeholder="Enter a seed..." />
              <Button variant="ghost" size="icon-sm" onClick={generateNew} title="Random seed"><Shuffle /></Button>
            </div>
          </label>
          <label className="palette-count-input">
            <span>Colors</span>
            <div className="count-stepper">
              <button onClick={() => updateCount(count - 1)} disabled={count <= 3}>-</button>
              <span>{count}</span>
              <button onClick={() => updateCount(count + 1)} disabled={count >= 8}>+</button>
            </div>
          </label>
          <label className="palette-harmony-input">
            <span>Harmony</span>
            <select value={harmony} onChange={(event) => updateHarmony(event.target.value as Harmony)} aria-describedby="palette-harmony-hint">
              {HARMONIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
          </label>
          <Button onClick={generateNew} className="palette-generate"><RefreshCw /> Generate</Button>
          <p className="palette-harmony-note" id="palette-harmony-hint"><Info /><span><strong>{harmonyInfo.label}</strong> {harmonyInfo.description}</span></p>
        </div>

        <div className="palette-strip">
          {colors.map((color, i) => {
            const hex = rgbToHex(color)
            const label = `color-${i}`
            return (
              <button
                key={`${hex}-${i}`}
                className="palette-swatch"
                style={{ background: hex, color: readableTextColor(color) }}
                onClick={() => void copyValue(label, hex)}
                aria-label={`Copy ${hex}, color ${i + 1} of ${colors.length}`}
                title={`Copy ${hex}`}
              >
                <span className="swatch-hex">{hex}</span>
                {copied === label ? <Check /> : <Clipboard />}
              </button>
            )
          })}
        </div>

        <div className="palette-export-section">
          <div className="palette-export-heading">
            <div><SwatchBook /><span><strong>Export palette</strong><small>Click format to copy</small></span></div>
            <div className="export-format-switch">
              {(['css', 'json', 'tailwind', 'scss'] as const).map((fmt) => (
                <button key={fmt} className={exportFormat === fmt ? 'active' : ''} onClick={() => setExportFormat(fmt)}>{fmt.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="palette-export-code">
            <pre>{exportValue}</pre>
            <Button variant="ghost" size="sm" onClick={() => void copyValue('export', exportValue)}>
              {copied === 'export' ? <Check /> : <Clipboard />} {copied === 'export' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="palette-export-actions">
            <Button variant="outline" size="sm" onClick={() => void copyValue('all', colors.map(rgbToHex).join(', '))}>{copied === 'all' ? <Check /> : <Copy />} {copied === 'all' ? 'Copied colors' : 'Copy all colors'}</Button>
            <Button variant="outline" size="sm" onClick={downloadCode}><ArrowDownToLine /> Download {exportFormat.toUpperCase()}</Button>
            <Button variant="outline" size="sm" onClick={downloadPng}><ArrowDownToLine /> Download PNG</Button>
          </div>
        </div>
      </section>

      <canvas ref={canvasRef} hidden />
    </div>
  )
}
