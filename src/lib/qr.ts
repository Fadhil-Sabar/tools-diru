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
  showPlaceholder?: boolean
  placeholderText?: string
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  ecc: 'M',
  margin: 2,
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  width: 512,
  showPlaceholder: false,
  placeholderText: '',
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

export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export function addPlaceholderToSvg(svg: string, text: string, options: QrOptions): string {
  const match = svg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/)
  if (!match) return svg
  const w = parseFloat(match[1])
  const h = parseFloat(match[2])
  const extraH = Math.max(4.5, Math.round(w * 0.18))
  const newH = h + extraH

  const sanitized = text.replace(/\r?\n+/g, ' ').trim()
  const displayLabel = sanitized.length > 42 ? `${sanitized.slice(0, 39)}…` : sanitized
  const maxFontSize = extraH * 0.38
  const fitFontSize = (w - 2) / (0.58 * Math.max(displayLabel.length, 1))
  const fontSize = Number(Math.min(maxFontSize, Math.max(1.0, fitFontSize)).toFixed(2))

  let modified = svg.replace(/viewBox="0 0 [0-9.]+ [0-9.]+"/, `viewBox="0 0 ${w} ${newH}"`)
  if (!options.transparentBg) {
    const bgRegex = new RegExp(`d="M0 0h${w}v${h}H0z"`)
    if (bgRegex.test(modified)) {
      modified = modified.replace(bgRegex, `d="M0 0h${w}v${newH}H0z"`)
    } else {
      const firstPath = modified.indexOf('<path')
      if (firstPath !== -1) {
        const bgPath = `<path fill="${options.bgColor || '#ffffff'}" d="M0 0h${w}v${newH}H0z"/>`
        modified = modified.slice(0, firstPath) + bgPath + modified.slice(firstPath)
      }
    }
  }

  const xPos = (w / 2).toFixed(2)
  const yPos = (h + extraH * 0.52).toFixed(2)
  const textElem = `<text x="${xPos}" y="${yPos}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${fontSize}" font-weight="500" fill="${options.fgColor || '#000000'}" text-anchor="middle" dominant-baseline="middle" shape-rendering="auto">${escapeXml(displayLabel)}</text>`
  modified = modified.replace('</svg>', `${textElem}</svg>`)
  return modified
}

export async function generateQrSvg(content: string, options: QrOptions): Promise<string> {
  const text = content.trim() || ' '
  const lightColor = options.transparentBg ? '#00000000' : (options.bgColor || '#ffffff')
  const darkColor = options.fgColor || '#000000'

  const rawSvg = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })

  if (options.showPlaceholder && options.placeholderText?.trim()) {
    return addPlaceholderToSvg(rawSvg, options.placeholderText, options)
  }

  return rawSvg
}

export async function generateQrDataUrl(content: string, options: QrOptions, targetWidth = 512): Promise<string> {
  const text = content.trim() || ' '
  const lightColor = options.transparentBg ? '#00000000' : (options.bgColor || '#ffffff')
  const darkColor = options.fgColor || '#000000'

  const baseDataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    width: targetWidth,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })

  if (!options.showPlaceholder || !options.placeholderText?.trim() || typeof document === 'undefined') {
    return baseDataUrl
  }

  return new Promise<string>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const extraHeight = Math.max(36, Math.round(targetWidth * 0.16))
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetWidth + extraHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(baseDataUrl)
        return
      }

      if (!options.transparentBg) {
        ctx.fillStyle = options.bgColor || '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetWidth)

      const placeholder = options.placeholderText?.replace(/\r?\n+/g, ' ').trim() || ''
      const maxTextWidth = targetWidth - Math.max(24, Math.round(targetWidth * 0.08))

      const maxFontSize = Math.round(extraHeight * 0.36)
      let fontSize = maxFontSize
      ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

      let displayText = placeholder
      if (ctx.measureText(displayText).width > maxTextWidth) {
        const minFontSize = Math.round(extraHeight * 0.22)
        fontSize = minFontSize
        ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

        if (ctx.measureText(displayText).width > maxTextWidth) {
          while (displayText.length > 3 && ctx.measureText(`${displayText}…`).width > maxTextWidth) {
            displayText = displayText.slice(0, -1)
          }
          displayText += '…'
        }
      }

      ctx.fillStyle = options.fgColor || '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(displayText, targetWidth / 2, targetWidth + extraHeight * 0.5)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(baseDataUrl)
    img.src = baseDataUrl
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
