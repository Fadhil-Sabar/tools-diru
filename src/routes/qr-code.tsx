import { useEffect, useMemo, useState } from 'react'
import {
  AlignLeft,
  ArrowDownToLine,
  Check,
  Clipboard,
  Contact,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode as QrIcon,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wifi,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  buildEmailPayload,
  buildGeoPayload,
  buildSmsPayload,
  buildVCardPayload,
  buildWifiPayload,
  DEFAULT_QR_OPTIONS,
  generateQrDataUrl,
  generateQrSvg,
  inspectQr,
  sanitizeUrl,
  type EmailData,
  type GeoData,
  type QrEccLevel,
  type QrMargin,
  type QrMode,
  type QrOptions,
  type SmsData,
  type VCardData,
  type WifiData,
} from '@/lib/qr'

const COLOR_PRESETS = [
  { name: 'Classic', fg: '#000000', bg: '#ffffff' },
  { name: 'Navy', fg: '#0f172a', bg: '#f8fafc' },
  { name: 'Rust', fg: '#9a3412', bg: '#fff7ed' },
  { name: 'Pine', fg: '#14532d', bg: '#f0fdf4' },
  { name: 'Indigo', fg: '#312e81', bg: '#eef2ff' },
  { name: 'Charcoal', fg: '#18181b', bg: '#f4f4f5' },
]

const RESOLUTIONS = [256, 512, 1024, 2048] as const

export default function QrCodeRoute() {
  const [mode, setMode] = useState<QrMode>(() => (localStorage.getItem('qr-mode') as QrMode) || 'url')
  const [urlInput, setUrlInput] = useState(() => localStorage.getItem('qr-url') ?? 'https://github.com')
  const [textInput, setTextInput] = useState(() => localStorage.getItem('qr-text') ?? 'Hello, world! Scan to explore.')
  
  const [wifiData, setWifiData] = useState<WifiData>(() => {
    try {
      const saved = localStorage.getItem('qr-wifi')
      return saved ? JSON.parse(saved) : { ssid: 'Guest-WiFi', password: '', security: 'WPA', hidden: false }
    } catch {
      return { ssid: 'Guest-WiFi', password: '', security: 'WPA', hidden: false }
    }
  })

  const [emailData, setEmailData] = useState<EmailData>(() => {
    try {
      const saved = localStorage.getItem('qr-email')
      return saved ? JSON.parse(saved) : { to: 'contact@example.com', subject: 'Inquiry', body: 'Hi there!' }
    } catch {
      return { to: 'contact@example.com', subject: 'Inquiry', body: 'Hi there!' }
    }
  })

  const [smsData, setSmsData] = useState<SmsData>(() => {
    try {
      const saved = localStorage.getItem('qr-sms')
      return saved ? JSON.parse(saved) : { phone: '+1234567890', message: 'Hello from QR Code!' }
    } catch {
      return { phone: '+1234567890', message: 'Hello from QR Code!' }
    }
  })

  const [phoneInput, setPhoneInput] = useState(() => localStorage.getItem('qr-phone') ?? '+1234567890')

  const [vcardData, setVcardData] = useState<VCardData>(() => {
    try {
      const saved = localStorage.getItem('qr-vcard')
      return saved ? JSON.parse(saved) : {
        firstName: 'Alex',
        lastName: 'Morgan',
        organization: 'Acme Corp',
        title: 'Lead Designer',
        phone: '+1 (555) 019-2834',
        email: 'alex.morgan@example.com',
        url: 'https://alexmorgan.design',
        note: 'Met at Design Summit 2026',
      }
    } catch {
      return {
        firstName: 'Alex',
        lastName: 'Morgan',
        organization: 'Acme Corp',
        title: 'Lead Designer',
        phone: '+1 (555) 019-2834',
        email: 'alex.morgan@example.com',
        url: 'https://alexmorgan.design',
        note: '',
      }
    }
  })

  const [geoData, setGeoData] = useState<GeoData>(() => {
    try {
      const saved = localStorage.getItem('qr-geo')
      return saved ? JSON.parse(saved) : { latitude: '35.6762', longitude: '139.6503' }
    } catch {
      return { latitude: '35.6762', longitude: '139.6503' }
    }
  })

  const [ecc, setEcc] = useState<QrEccLevel>(() => (localStorage.getItem('qr-ecc') as QrEccLevel) || 'M')
  const [margin, setMargin] = useState<QrMargin>(() => (Number(localStorage.getItem('qr-margin')) as QrMargin) || 2)
  const [fgColor, setFgColor] = useState(() => localStorage.getItem('qr-fg') ?? '#000000')
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('qr-bg') ?? '#ffffff')
  const [transparentBg, setTransparentBg] = useState(() => localStorage.getItem('qr-trans') === 'true')
  const [exportWidth, setExportWidth] = useState<number>(() => Number(localStorage.getItem('qr-export-width')) || 512)
  const [showWifiPassword, setShowWifiPassword] = useState(false)

  const [svgMarkup, setSvgMarkup] = useState('')
  const [dataUrl, setDataUrl] = useState('')
  const [copied, setCopied] = useState<string>('')
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Save changes to localStorage
  useEffect(() => localStorage.setItem('qr-mode', mode), [mode])
  useEffect(() => localStorage.setItem('qr-url', urlInput), [urlInput])
  useEffect(() => localStorage.setItem('qr-text', textInput), [textInput])
  useEffect(() => localStorage.setItem('qr-wifi', JSON.stringify(wifiData)), [wifiData])
  useEffect(() => localStorage.setItem('qr-email', JSON.stringify(emailData)), [emailData])
  useEffect(() => localStorage.setItem('qr-sms', JSON.stringify(smsData)), [smsData])
  useEffect(() => localStorage.setItem('qr-phone', phoneInput), [phoneInput])
  useEffect(() => localStorage.setItem('qr-vcard', JSON.stringify(vcardData)), [vcardData])
  useEffect(() => localStorage.setItem('qr-geo', JSON.stringify(geoData)), [geoData])
  useEffect(() => localStorage.setItem('qr-ecc', ecc), [ecc])
  useEffect(() => localStorage.setItem('qr-margin', String(margin)), [margin])
  useEffect(() => localStorage.setItem('qr-fg', fgColor), [fgColor])
  useEffect(() => localStorage.setItem('qr-bg', bgColor), [bgColor])
  useEffect(() => localStorage.setItem('qr-trans', String(transparentBg)), [transparentBg])
  useEffect(() => localStorage.setItem('qr-export-width', String(exportWidth)), [exportWidth])

  // Compute the current active payload
  const currentPayload = useMemo(() => {
    switch (mode) {
      case 'url':
        return sanitizeUrl(urlInput)
      case 'text':
        return textInput
      case 'wifi':
        return buildWifiPayload(wifiData)
      case 'email':
        return buildEmailPayload(emailData)
      case 'phone':
        return phoneInput.trim() ? `tel:${phoneInput.trim()}` : ''
      case 'sms':
        return buildSmsPayload(smsData)
      case 'vcard':
        return buildVCardPayload(vcardData)
      case 'geo':
        return buildGeoPayload(geoData)
      default:
        return ''
    }
  }, [mode, urlInput, textInput, wifiData, emailData, phoneInput, smsData, vcardData, geoData])

  const qrOptions: QrOptions = useMemo(() => ({
    ecc,
    margin,
    fgColor,
    bgColor,
    transparentBg,
    width: exportWidth,
  }), [ecc, margin, fgColor, bgColor, transparentBg, exportWidth])

  const inspection = useMemo(() => {
    return inspectQr(currentPayload, ecc)
  }, [currentPayload, ecc])

  useEffect(() => {
    let active = true
    async function renderQr() {
      if (!currentPayload.trim()) {
        setSvgMarkup('')
        setDataUrl('')
        setGenerationError(null)
        return
      }
      try {
        const [svg, url] = await Promise.all([
          generateQrSvg(currentPayload, qrOptions),
          generateQrDataUrl(currentPayload, qrOptions, exportWidth),
        ])
        if (active) {
          setSvgMarkup(svg)
          setDataUrl(url)
          setGenerationError(null)
        }
      } catch (err) {
        if (active) {
          setGenerationError(err instanceof Error ? err.message : 'Failed to generate QR code')
        }
      }
    }
    void renderQr()
    return () => {
      active = false
    }
  }, [currentPayload, qrOptions, exportWidth])

  async function copyToClipboard(label: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  async function copyImageToClipboard() {
    if (!dataUrl) return
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied('image')
      window.setTimeout(() => setCopied(''), 1400)
    } catch {
      // Fallback: copy base64 data URL
      await copyToClipboard('image', dataUrl)
    }
  }

  function downloadFile(contentUrl: string, filename: string) {
    const anchor = document.createElement('a')
    anchor.href = contentUrl
    anchor.download = filename
    anchor.click()
  }

  function downloadPng() {
    if (!dataUrl) return
    downloadFile(dataUrl, `qrcode-${exportWidth}px.png`)
  }

  function downloadSvg() {
    if (!svgMarkup) return
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    downloadFile(url, `qrcode.svg`)
    URL.revokeObjectURL(url)
  }

  function downloadJpeg() {
    if (!dataUrl) return
    const canvas = document.createElement('canvas')
    canvas.width = exportWidth
    canvas.height = exportWidth
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.fillStyle = transparentBg ? '#ffffff' : bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const jpgUrl = canvas.toDataURL('image/jpeg', 0.92)
      downloadFile(jpgUrl, `qrcode-${exportWidth}px.jpg`)
    }
    img.src = dataUrl
  }

  function applyPresetColor(fg: string, bg: string) {
    setFgColor(fg)
    setBgColor(bg)
    setTransparentBg(false)
  }

  function clearActiveInput() {
    switch (mode) {
      case 'url':
        setUrlInput('')
        break
      case 'text':
        setTextInput('')
        break
      case 'wifi':
        setWifiData({ ssid: '', password: '', security: 'WPA', hidden: false })
        break
      case 'email':
        setEmailData({ to: '', subject: '', body: '' })
        break
      case 'phone':
        setPhoneInput('')
        break
      case 'sms':
        setSmsData({ phone: '', message: '' })
        break
      case 'vcard':
        setVcardData({ firstName: '', lastName: '', organization: '', title: '', phone: '', email: '', url: '', note: '' })
        break
      case 'geo':
        setGeoData({ latitude: '', longitude: '' })
        break
    }
  }

  const modes: Array<{ id: QrMode; label: string; icon: typeof Globe }> = [
    { id: 'url', label: 'URL / Link', icon: Globe },
    { id: 'text', label: 'Plain text', icon: AlignLeft },
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'vcard', label: 'Contact', icon: Contact },
    { id: 'geo', label: 'Location', icon: MapPin },
  ]

  return (
    <div className="qr-tool">
      <section className="qr-workspace">
        {/* Mode Selector Tabs */}
        <div className="qr-mode-bar" role="tablist" aria-label="QR Code Input Modes">
          {modes.map((item) => {
            const Icon = item.icon
            const active = mode === item.id
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                className={active ? 'active' : ''}
                onClick={() => setMode(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Grid: Input / Customization vs Live Preview */}
        <div className="qr-grid">
          {/* Left Column: Data Form & Appearance Settings */}
          <div className="qr-input-column">
            {/* Input Panel */}
            <div className="qr-panel">
              <div className="qr-panel-heading">
                <div className="qr-heading-title">
                  <span className="side-index">01</span>
                  <h2>
                    {mode === 'url' && 'Web Link & Address'}
                    {mode === 'text' && 'Plain Text Content'}
                    {mode === 'wifi' && 'Wi-Fi Network Credentials'}
                    {mode === 'email' && 'Email Composition'}
                    {mode === 'phone' && 'Phone Number (Tel)'}
                    {mode === 'sms' && 'SMS Text Message'}
                    {mode === 'vcard' && 'Digital Contact Card (vCard)'}
                    {mode === 'geo' && 'Geographic Coordinates'}
                  </h2>
                </div>
                <div className="qr-panel-actions">
                  <Button variant="ghost" size="sm" onClick={clearActiveInput} title="Clear current input">
                    <Trash2 /> Clear
                  </Button>
                </div>
              </div>

              <div className="qr-form-body">
                {mode === 'url' && (
                  <div className="qr-field-group">
                    <label>
                      <span>Destination URL</span>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/page"
                        aria-label="Destination URL"
                        autoFocus
                      />
                    </label>
                    <div className="qr-quick-presets">
                      <small>Quick examples:</small>
                      <button type="button" onClick={() => setUrlInput('https://github.com')}>GitHub</button>
                      <button type="button" onClick={() => setUrlInput('https://wikipedia.org')}>Wikipedia</button>
                      <button type="button" onClick={() => setUrlInput('https://news.ycombinator.com')}>Hacker News</button>
                    </div>
                  </div>
                )}

                {mode === 'text' && (
                  <div className="qr-field-group">
                    <label>
                      <span>Text message or notes</span>
                      <textarea
                        rows={6}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type any message, API key, identifier, or plain text..."
                        aria-label="Text to encode"
                        autoFocus
                      />
                    </label>
                  </div>
                )}

                {mode === 'wifi' && (
                  <div className="qr-form-grid">
                    <label className="col-span-2">
                      <span>Network Name (SSID)</span>
                      <input
                        type="text"
                        value={wifiData.ssid}
                        onChange={(e) => setWifiData((prev) => ({ ...prev, ssid: e.target.value }))}
                        placeholder="e.g. CoffeeShop-5G"
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>Security Type</span>
                      <select
                        value={wifiData.security}
                        onChange={(e) => setWifiData((prev) => ({ ...prev, security: e.target.value as WifiData['security'] }))}
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open)</option>
                      </select>
                    </label>

                    {wifiData.security !== 'nopass' && (
                      <label>
                        <span>Password</span>
                        <div className="qr-input-with-action">
                          <input
                            type={showWifiPassword ? 'text' : 'password'}
                            value={wifiData.password}
                            onChange={(e) => setWifiData((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="Wi-Fi Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowWifiPassword((v) => !v)}
                            aria-label={showWifiPassword ? 'Hide password' : 'Show password'}
                          >
                            {showWifiPassword ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                      </label>
                    )}

                    <div className="col-span-2">
                      <label className="qr-checkbox-label">
                        <input
                          type="checkbox"
                          checked={wifiData.hidden}
                          onChange={(e) => setWifiData((prev) => ({ ...prev, hidden: e.target.checked }))}
                        />
                        <span><Check /></span>
                        Hidden Network (SSID is not broadcasted)
                      </label>
                    </div>
                  </div>
                )}

                {mode === 'email' && (
                  <div className="qr-form-grid">
                    <label className="col-span-2">
                      <span>Recipient Email</span>
                      <input
                        type="email"
                        value={emailData.to}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, to: e.target.value }))}
                        placeholder="hello@example.com"
                        autoFocus
                      />
                    </label>
                    <label className="col-span-2">
                      <span>Subject</span>
                      <input
                        type="text"
                        value={emailData.subject}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Feedback or Inquiry"
                      />
                    </label>
                    <label className="col-span-2">
                      <span>Body</span>
                      <textarea
                        rows={4}
                        value={emailData.body}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, body: e.target.value }))}
                        placeholder="Pre-populated message content..."
                      />
                    </label>
                  </div>
                )}

                {mode === 'phone' && (
                  <div className="qr-field-group">
                    <label>
                      <span>Phone Number</span>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        autoFocus
                      />
                    </label>
                  </div>
                )}

                {mode === 'sms' && (
                  <div className="qr-form-grid">
                    <label className="col-span-2">
                      <span>Phone Number</span>
                      <input
                        type="tel"
                        value={smsData.phone}
                        onChange={(e) => setSmsData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        autoFocus
                      />
                    </label>
                    <label className="col-span-2">
                      <span>Pre-filled SMS text</span>
                      <textarea
                        rows={3}
                        value={smsData.message}
                        onChange={(e) => setSmsData((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Hey! Just checking in."
                      />
                    </label>
                  </div>
                )}

                {mode === 'vcard' && (
                  <div className="qr-form-grid">
                    <label>
                      <span>First Name</span>
                      <input
                        type="text"
                        value={vcardData.firstName}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First name"
                      />
                    </label>
                    <label>
                      <span>Last Name</span>
                      <input
                        type="text"
                        value={vcardData.lastName}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last name"
                      />
                    </label>
                    <label>
                      <span>Organization / Company</span>
                      <input
                        type="text"
                        value={vcardData.organization}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, organization: e.target.value }))}
                        placeholder="Company"
                      />
                    </label>
                    <label>
                      <span>Job Title</span>
                      <input
                        type="text"
                        value={vcardData.title}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Role / Title"
                      />
                    </label>
                    <label>
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={vcardData.phone}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 555 123 4567"
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={vcardData.email}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="email@domain.com"
                      />
                    </label>
                    <label className="col-span-2">
                      <span>Website / Portfolio</span>
                      <input
                        type="url"
                        value={vcardData.url}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, url: e.target.value }))}
                        placeholder="https://mysite.com"
                      />
                    </label>
                    <label className="col-span-2">
                      <span>Notes</span>
                      <input
                        type="text"
                        value={vcardData.note}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Additional note"
                      />
                    </label>
                  </div>
                )}

                {mode === 'geo' && (
                  <div className="qr-form-grid">
                    <label>
                      <span>Latitude</span>
                      <input
                        type="text"
                        value={geoData.latitude}
                        onChange={(e) => setGeoData((prev) => ({ ...prev, latitude: e.target.value }))}
                        placeholder="37.7749"
                        autoFocus
                      />
                    </label>
                    <label>
                      <span>Longitude</span>
                      <input
                        type="text"
                        value={geoData.longitude}
                        onChange={(e) => setGeoData((prev) => ({ ...prev, longitude: e.target.value }))}
                        placeholder="-122.4194"
                      />
                    </label>
                    <div className="col-span-2 qr-quick-presets">
                      <small>Preset cities:</small>
                      <button type="button" onClick={() => setGeoData({ latitude: '35.6762', longitude: '139.6503' })}>Tokyo</button>
                      <button type="button" onClick={() => setGeoData({ latitude: '40.7128', longitude: '-74.0060' })}>New York</button>
                      <button type="button" onClick={() => setGeoData({ latitude: '51.5074', longitude: '-0.1278' })}>London</button>
                      <button type="button" onClick={() => setGeoData({ latitude: '48.8566', longitude: '2.3522' })}>Paris</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customization & Appearance Settings Panel */}
            <div className="qr-panel qr-settings-panel">
              <div className="qr-panel-heading">
                <div className="qr-heading-title">
                  <span className="side-index">02</span>
                  <h2>QR Style & Error Correction</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEcc(DEFAULT_QR_OPTIONS.ecc)
                    setMargin(DEFAULT_QR_OPTIONS.margin)
                    setFgColor(DEFAULT_QR_OPTIONS.fgColor)
                    setBgColor(DEFAULT_QR_OPTIONS.bgColor)
                    setTransparentBg(DEFAULT_QR_OPTIONS.transparentBg)
                  }}
                  title="Reset styling to defaults"
                >
                  <RefreshCw /> Reset
                </Button>
              </div>

              <div className="qr-settings-grid">
                {/* ECC Level */}
                <div className="qr-setting-block">
                  <label>
                    <span>Error Correction Level</span>
                    <select value={ecc} onChange={(e) => setEcc(e.target.value as QrEccLevel)}>
                      <option value="L">Low (~7% recovery - least dense)</option>
                      <option value="M">Medium (~15% recovery - balanced)</option>
                      <option value="Q">Quartile (~25% recovery - durable)</option>
                      <option value="H">High (~30% recovery - highest redundancy)</option>
                    </select>
                  </label>
                  <p className="qr-setting-hint">Higher levels resist damage or smudging, but increase QR grid density.</p>
                </div>

                {/* Margin */}
                <div className="qr-setting-block">
                  <label>
                    <span>Quiet Zone (Border Margin)</span>
                    <select value={margin} onChange={(e) => setMargin(Number(e.target.value) as QrMargin)}>
                      <option value="0">0 modules (None)</option>
                      <option value="1">1 module (Compact)</option>
                      <option value="2">2 modules (Standard)</option>
                      <option value="4">4 modules (Wide / Official spec)</option>
                    </select>
                  </label>
                  <p className="qr-setting-hint">Margin helps scanners isolate code from background graphics.</p>
                </div>

                {/* Colors */}
                <div className="qr-setting-block col-span-2">
                  <span className="qr-subheading">Color Palette</span>
                  <div className="qr-color-palette-bar">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className="qr-color-chip"
                        onClick={() => applyPresetColor(preset.fg, preset.bg)}
                        title={preset.name}
                      >
                        <span style={{ backgroundColor: preset.bg, borderColor: 'var(--rule)' }}>
                          <i style={{ backgroundColor: preset.fg }} />
                        </span>
                        <small>{preset.name}</small>
                      </button>
                    ))}
                  </div>

                  <div className="qr-color-pickers">
                    <label className="qr-color-input">
                      <span>Dark Modules</span>
                      <div className="qr-color-field">
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                        />
                        <input
                          type="text"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          maxLength={7}
                        />
                      </div>
                    </label>

                    <label className="qr-color-input">
                      <span>Light Background</span>
                      <div className="qr-color-field">
                        <input
                          type="color"
                          disabled={transparentBg}
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <input
                          type="text"
                          disabled={transparentBg}
                          value={transparentBg ? 'Transparent' : bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          maxLength={7}
                        />
                      </div>
                    </label>

                    <div className="qr-trans-toggle">
                      <label className="qr-checkbox-label">
                        <input
                          type="checkbox"
                          checked={transparentBg}
                          onChange={(e) => setTransparentBg(e.target.checked)}
                        />
                        <span><Check /></span>
                        Transparent Background
                      </label>
                    </div>
                  </div>
                </div>

                {/* Export Resolution */}
                <div className="qr-setting-block col-span-2">
                  <label>
                    <span>Export Pixel Dimension</span>
                    <div className="qr-button-radio-group">
                      {RESOLUTIONS.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={exportWidth === size ? 'active' : ''}
                          onClick={() => setExportWidth(size)}
                        >
                          {size} × {size}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Preview & Actions */}
          <div className="qr-preview-column">
            <div className="qr-preview-card">
              <div className="qr-panel-heading">
                <div className="qr-heading-title">
                  <QrIcon className="text-pine" />
                  <h2>Real-time Output</h2>
                </div>
                {inspection && (
                  <span className="qr-meta-tag">
                    {inspection.byteCount} bytes · v{inspection.version}
                  </span>
                )}
              </div>

              {/* QR Code Canvas/SVG Display Box */}
              <div className="qr-preview-stage">
                {generationError ? (
                  <div className="qr-error-box">
                    <p>{generationError}</p>
                  </div>
                ) : svgMarkup ? (
                  <div className={`qr-display-box ${transparentBg ? 'is-transparent' : ''}`}>
                    <div
                      className="qr-svg-wrapper"
                      dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    />
                  </div>
                ) : (
                  <div className="qr-placeholder-box">
                    <QrIcon />
                    <p>Enter text or a link to generate your QR code</p>
                  </div>
                )}
              </div>

              {/* Live Technical Metrics */}
              {inspection && (
                <div className="qr-metrics-bar">
                  <div>
                    <span>Matrix Grid</span>
                    <strong>{inspection.modulesCount} × {inspection.modulesCount}</strong>
                  </div>
                  <div>
                    <span>Error Recovery</span>
                    <strong>{inspection.eccPercent} ({inspection.eccLevel})</strong>
                  </div>
                  <div>
                    <span>Payload Size</span>
                    <strong>{inspection.byteCount} B</strong>
                  </div>
                  <div>
                    <span>Version</span>
                    <strong>{inspection.version}</strong>
                  </div>
                </div>
              )}

              {/* Actions & Export Downloads */}
              <div className="qr-actions-section">
                <div className="qr-action-group">
                  <span className="qr-action-label">Quick Copy</span>
                  <div className="qr-action-buttons">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyImageToClipboard}
                      disabled={!dataUrl}
                    >
                      {copied === 'image' ? <Check /> : <Copy />}
                      {copied === 'image' ? 'Copied image' : 'Copy image'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('svg', svgMarkup)}
                      disabled={!svgMarkup}
                    >
                      {copied === 'svg' ? <Check /> : <Clipboard />}
                      {copied === 'svg' ? 'Copied SVG' : 'Copy SVG markup'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('payload', currentPayload)}
                      disabled={!currentPayload}
                    >
                      {copied === 'payload' ? <Check /> : <Clipboard />}
                      {copied === 'payload' ? 'Copied text' : 'Copy raw content'}
                    </Button>
                  </div>
                </div>

                <div className="qr-action-group">
                  <span className="qr-action-label">Save & Export</span>
                  <div className="qr-action-buttons">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={downloadPng}
                      disabled={!dataUrl}
                    >
                      <ArrowDownToLine /> Download PNG ({exportWidth}px)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSvg}
                      disabled={!svgMarkup}
                    >
                      <ArrowDownToLine /> Download SVG (Vector)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadJpeg}
                      disabled={!dataUrl}
                    >
                      <ArrowDownToLine /> Download JPG
                    </Button>
                  </div>
                </div>

                {/* Raw Encoded Payload Preview */}
                {currentPayload && (
                  <div className="qr-payload-inspector">
                    <label>
                      <span>Encoded Payload Content</span>
                      <code>{currentPayload}</code>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="qr-privacy-footer">
              <ShieldCheck />
              <div>
                <strong>Client-side encryption</strong>
                <p>QR code rendering is performed entirely in your browser using local canvas and vector operations. No payload data is ever transmitted to any external server.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
