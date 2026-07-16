import { X } from 'lucide-react'

import type { MarginPreset, MarkdownSettings, PageSize } from '@/lib/markdown'

interface MarkdownSettingsDrawerProps {
  settings: MarkdownSettings
  onChange: (settings: MarkdownSettings) => void
  onClose: () => void
}

const BODY_FONTS = ['Newsreader Variable', 'Georgia', 'Cambria', 'Times New Roman', 'Geist Variable', 'system-ui']
const HEADING_FONTS = ['Newsreader Variable', 'Georgia', 'Cambria', 'Geist Variable', 'system-ui']
const CODE_FONTS = ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="markdown-setting-field"><span>{label}</span>{children}</label>
}

function FontField({ label, value, custom, fonts, onValue, onCustom }: {
  label: string
  value: string
  custom: string
  fonts: string[]
  onValue: (value: string) => void
  onCustom: (value: string) => void
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onValue(event.target.value)}>{fonts.map((font) => <option key={font}>{font}</option>)}</select>
      <input value={custom} onChange={(event) => onCustom(event.target.value)} placeholder="Custom font family" />
    </Field>
  )
}

function RangeField({ label, value, min, max, step, unit, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      <div className="markdown-range-row">
        <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{value}{unit}</output>
      </div>
    </Field>
  )
}

export default function MarkdownSettingsDrawer({ settings, onChange, onClose }: MarkdownSettingsDrawerProps) {
  const update = (partial: Partial<MarkdownSettings>) => onChange({ ...settings, ...partial })

  function setMarginPreset(preset: MarginPreset) {
    const margin = preset === 'normal' ? 25 : preset === 'narrow' ? 12 : preset === 'wide' ? 38 : null
    update(margin === null ? { marginPreset: preset } : {
      marginPreset: preset,
      marginTop: margin,
      marginRight: margin,
      marginBottom: margin,
      marginLeft: margin,
    })
  }

  return (
    <aside className="markdown-settings" aria-label="Document settings">
      <div className="markdown-settings-heading"><div><strong>Document settings</strong><small>Preview and print</small></div><button onClick={onClose} aria-label="Close settings"><X /></button></div>
      <div className="markdown-settings-scroll">
        <fieldset>
          <legend>Typography</legend>
          <FontField label="Body" value={settings.bodyFont} custom={settings.customBodyFont} fonts={BODY_FONTS} onValue={(bodyFont) => update({ bodyFont })} onCustom={(customBodyFont) => update({ customBodyFont })} />
          <FontField label="Headings" value={settings.headingFont} custom={settings.customHeadingFont} fonts={HEADING_FONTS} onValue={(headingFont) => update({ headingFont })} onCustom={(customHeadingFont) => update({ customHeadingFont })} />
          <FontField label="Code" value={settings.codeFont} custom={settings.customCodeFont} fonts={CODE_FONTS} onValue={(codeFont) => update({ codeFont })} onCustom={(customCodeFont) => update({ customCodeFont })} />
        </fieldset>

        <fieldset>
          <legend>Rhythm</legend>
          <div className="markdown-presets" aria-label="Typography presets">
            <button onClick={() => update({ fontSize: 10, lineHeight: 1.3, paragraphSpacing: 6 })}>Compact</button>
            <button onClick={() => update({ fontSize: 12, lineHeight: 1.6, paragraphSpacing: 12 })}>Editorial</button>
            <button onClick={() => update({ fontSize: 14, lineHeight: 1.8, paragraphSpacing: 18 })}>Relaxed</button>
          </div>
          <RangeField label="Body size" value={settings.fontSize} min={9} max={24} step={1} unit="pt" onChange={(fontSize) => update({ fontSize })} />
          <RangeField label="Line height" value={settings.lineHeight} min={1} max={2.5} step={0.1} unit="" onChange={(lineHeight) => update({ lineHeight })} />
          <RangeField label="Paragraph space" value={settings.paragraphSpacing} min={0} max={32} step={1} unit="px" onChange={(paragraphSpacing) => update({ paragraphSpacing })} />
        </fieldset>

        <fieldset>
          <legend>Page</legend>
          <div className="markdown-segments four" aria-label="Page size">{(['A4', 'Letter', 'Legal', 'A5'] satisfies PageSize[]).map((pageSize) => <button key={pageSize} className={settings.pageSize === pageSize ? 'active' : ''} onClick={() => update({ pageSize })}>{pageSize}</button>)}</div>
          <div className="markdown-segments" aria-label="Orientation"><button className={!settings.landscape ? 'active' : ''} onClick={() => update({ landscape: false })}>Portrait</button><button className={settings.landscape ? 'active' : ''} onClick={() => update({ landscape: true })}>Landscape</button></div>
          <div className="markdown-segments four" aria-label="Margin preset">{(['normal', 'narrow', 'wide', 'custom'] satisfies MarginPreset[]).map((preset) => <button key={preset} className={settings.marginPreset === preset ? 'active' : ''} onClick={() => setMarginPreset(preset)}>{preset}</button>)}</div>
          <div className="markdown-margin-grid">
            {(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => {
              const key = `margin${side}` as 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft'
              return <Field key={side} label={side}><input type="number" min={0} max={100} value={settings[key]} onChange={(event) => update({ [key]: Math.max(0, Math.min(100, Number(event.target.value))), marginPreset: 'custom' })} /></Field>
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>Canvas</legend>
          <label className="markdown-toggle"><span>Dark preview</span><input type="checkbox" checked={settings.previewDark} onChange={(event) => update({ previewDark: event.target.checked })} /></label>
        </fieldset>
      </div>
    </aside>
  )
}
