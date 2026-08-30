import QRCode from 'qrcode'

export type QrMode = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'geo'

export type QrEccLevel = 'L' | 'M' | 'Q' | 'H'

export type QrMargin = 0 | 1 | 2 | 4

export interface WifiData {
  ssid: string
  password: string
  security: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

export interface EmailData {
  to: string
  subject: string
  body: string
}

export interface SmsData {
  phone: string
  message: string
}

export interface VCardData {
  firstName: string
  lastName: string
  organization: string
  title: string
  phone: string
  email: string
  url: string
  note: string
}

export interface GeoData {
  latitude: string
  longitude: string
}

export interface QrOptions {
  ecc: QrEccLevel
  margin: QrMargin
  fgColor: string
  bgColor: string
  transparentBg: boolean
  width?: number
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  ecc: 'M',
  margin: 2,
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  width: 512,
}

export function escapeWifi(str: string): string {
  return str.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifiPayload(data: WifiData): string {
  const security = data.security === 'nopass' ? 'nopass' : data.security
  const ssid = escapeWifi(data.ssid)
  const password = data.security === 'nopass' ? '' : escapeWifi(data.password)
  const hidden = data.hidden ? 'true' : 'false'
  return `WIFI:S:${ssid};T:${security};P:${password};H:${hidden};;`
}

export function buildEmailPayload(data: EmailData): string {
  if (!data.to && !data.subject && !data.body) return ''
  const params: string[] = []
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`)
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`)
  const query = params.length > 0 ? `?${params.join('&')}` : ''
  return `mailto:${data.to}${query}`
}

export function buildSmsPayload(data: SmsData): string {
  if (!data.phone && !data.message) return ''
  const query = data.message ? `?body=${encodeURIComponent(data.message)}` : ''
  return `sms:${data.phone}${query}`
}

export function buildVCardPayload(data: VCardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${data.lastName};${data.firstName};;;`,
    `FN:${[data.firstName, data.lastName].filter(Boolean).join(' ')}`,
  ]
  if (data.organization) lines.push(`ORG:${data.organization}`)
  if (data.title) lines.push(`TITLE:${data.title}`)
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`)
  if (data.email) lines.push(`EMAIL:${data.email}`)
  if (data.url) lines.push(`URL:${data.url}`)
  if (data.note) lines.push(`NOTE:${data.note}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}

export function buildGeoPayload(data: GeoData): string {
  if (!data.latitude && !data.longitude) return ''
  return `geo:${data.latitude.trim()},${data.longitude.trim()}`
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//i.test(trimmed) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('sms:') || trimmed.startsWith('geo:')) {
    return trimmed
  }
  return `https://${trimmed}`
}

export async function generateQrSvg(content: string, options: QrOptions): Promise<string> {
  const text = content.trim() || ' '
  const lightColor = options.transparentBg ? '#00000000' : (options.bgColor || '#ffffff')
  const darkColor = options.fgColor || '#000000'

  return await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })
}

export async function generateQrDataUrl(content: string, options: QrOptions, targetWidth = 512): Promise<string> {
  const text = content.trim() || ' '
  const lightColor = options.transparentBg ? '#00000000' : (options.bgColor || '#ffffff')
  const darkColor = options.fgColor || '#000000'

  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    width: targetWidth,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })
}

export interface QrMetadata {
  version: number
  modulesCount: number
  byteCount: number
  eccLevel: QrEccLevel
  eccPercent: string
}

export function inspectQr(content: string, ecc: QrEccLevel): QrMetadata | null {
  const text = content.trim()
  if (!text) return null
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: ecc })
    const eccMap: Record<QrEccLevel, string> = {
      L: '~7%',
      M: '~15%',
      Q: '~25%',
      H: '~30%',
    }
    return {
      version: qr.version,
      modulesCount: qr.modules.size,
      byteCount: new TextEncoder().encode(text).length,
      eccLevel: ecc,
      eccPercent: eccMap[ecc],
    }
  } catch {
    return null
  }
}
