import { describe, expect, it } from 'vitest'
import {
  buildEmailPayload,
  buildGeoPayload,
  buildSmsPayload,
  buildVCardPayload,
  buildWifiPayload,
  DEFAULT_QR_OPTIONS,
  escapeWifi,
  generateQrDataUrl,
  generateQrSvg,
  inspectQr,
  sanitizeUrl,
} from './qr'

describe('qr helper', () => {
  it('escapes wifi strings properly', () => {
    expect(escapeWifi('My;Wifi:Name\\123,456"')).toBe('My\\;Wifi\\:Name\\\\123\\,456\\"')
  })

  it('builds wifi payload correctly', () => {
    const payload = buildWifiPayload({
      ssid: 'Home-WiFi',
      password: 'secret;password',
      security: 'WPA',
      hidden: false,
    })
    expect(payload).toBe('WIFI:S:Home-WiFi;T:WPA;P:secret\\;password;H:false;;')
  })

  it('builds email payload', () => {
    const payload = buildEmailPayload({
      to: 'hello@example.com',
      subject: 'Hello World',
      body: 'Testing 1 2 3',
    })
    expect(payload).toBe('mailto:hello@example.com?subject=Hello%20World&body=Testing%201%202%203')
  })

  it('builds sms payload', () => {
    const payload = buildSmsPayload({
      phone: '+1234567890',
      message: 'Hello QR',
    })
    expect(payload).toBe('sms:+1234567890?body=Hello%20QR')
  })

  it('builds vCard payload', () => {
    const payload = buildVCardPayload({
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'Computing',
      title: 'Mathematician',
      phone: '+15551234',
      email: 'ada@example.com',
      url: 'https://example.com',
      note: 'Pioneer',
    })
    expect(payload).toContain('BEGIN:VCARD')
    expect(payload).toContain('FN:Ada Lovelace')
    expect(payload).toContain('TEL;TYPE=CELL:+15551234')
    expect(payload).toContain('END:VCARD')
  })

  it('builds geo payload', () => {
    const payload = buildGeoPayload({
      latitude: '37.7749',
      longitude: '-122.4194',
    })
    expect(payload).toBe('geo:37.7749,-122.4194')
  })

  it('sanitizes URLs correctly', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com')
    expect(sanitizeUrl('https://example.com/test')).toBe('https://example.com/test')
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('inspects QR metadata', () => {
    const info = inspectQr('https://example.com', 'M')
    expect(info).not.toBeNull()
    expect(info?.version).toBeGreaterThan(0)
    expect(info?.modulesCount).toBeGreaterThan(0)
    expect(info?.byteCount).toBe(19)
    expect(info?.eccLevel).toBe('M')
  })

  it('generates SVG and DataURL', async () => {
    const svg = await generateQrSvg('https://example.com', DEFAULT_QR_OPTIONS)
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox')

    const dataUrl = await generateQrDataUrl('https://example.com', DEFAULT_QR_OPTIONS, 256)
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('generates SVG with placeholder text below the QR code', async () => {
    const rawSvg = await generateQrSvg('https://example.com', {
      ...DEFAULT_QR_OPTIONS,
      showPlaceholder: false,
    })
    const rawMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
    const rawH = parseInt(rawMatch?.[2] ?? '0', 10)

    const placeholderSvg = await generateQrSvg('https://example.com', {
      ...DEFAULT_QR_OPTIONS,
      showPlaceholder: true,
      placeholderText: 'https://example.com',
    })

    expect(placeholderSvg).toContain('<text')
    expect(placeholderSvg).toContain('https://example.com')
    expect(placeholderSvg).toContain('text-anchor="middle"')

    const placeholderMatch = placeholderSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
    const placeholderH = parseInt(placeholderMatch?.[2] ?? '0', 10)
    expect(placeholderH).toBeGreaterThan(rawH)
  })

  it('properly escapes special characters in SVG placeholder', async () => {
    const placeholderSvg = await generateQrSvg('https://example.com', {
      ...DEFAULT_QR_OPTIONS,
      showPlaceholder: true,
      placeholderText: 'Ben & Jerry\'s <Ice Cream> "Special"',
    })

    expect(placeholderSvg).toContain('Ben &amp; Jerry&apos;s &lt;Ice Cream&gt; &quot;Special&quot;')
    expect(placeholderSvg).not.toContain('<Ice Cream>')
  })
})
