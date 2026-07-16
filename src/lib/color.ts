export interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

export interface HslColor {
  h: number
  s: number
  l: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function rgbToHex({ r, g, b, a = 1 }: RgbColor) {
  const channel = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')
  const alpha = a < 1 ? channel(a * 255) : ''
  return `#${channel(r)}${channel(g)}${channel(b)}${alpha}`.toUpperCase()
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2
  let hue = 0

  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0
  return { h: Math.round(hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) }
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const lightness = clamp(l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const section = hue / 60
  const secondary = chroma * (1 - Math.abs((section % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (section < 1) [red, green] = [chroma, secondary]
  else if (section < 2) [red, green] = [secondary, chroma]
  else if (section < 3) [green, blue] = [chroma, secondary]
  else if (section < 4) [green, blue] = [secondary, chroma]
  else if (section < 5) [red, blue] = [secondary, chroma]
  else [red, blue] = [chroma, secondary]

  const match = lightness - chroma / 2
  return { r: Math.round((red + match) * 255), g: Math.round((green + match) * 255), b: Math.round((blue + match) * 255), a: 1 }
}

export function parseColor(value: string): RgbColor | null {
  const input = value.trim()
  const hex = input.match(/^#?([\da-f]{3,8})$/i)?.[1]
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const expanded = hex.length <= 4 ? [...hex].map((character) => character.repeat(2)).join('') : hex
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    }
  }

  const rgb = input.match(/^rgba?\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
  if (rgb) {
    const alpha = rgb[4]?.endsWith('%') ? Number.parseFloat(rgb[4]) / 100 : Number.parseFloat(rgb[4] ?? '1')
    return { r: clamp(Number(rgb[1]), 0, 255), g: clamp(Number(rgb[2]), 0, 255), b: clamp(Number(rgb[3]), 0, 255), a: clamp(alpha, 0, 1) }
  }

  const hsl = input.match(/^hsla?\(\s*([\d.-]+)(?:deg)?\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
  if (hsl) {
    const converted = hslToRgb({ h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) })
    converted.a = hsl[4]?.endsWith('%') ? Number.parseFloat(hsl[4]) / 100 : Number.parseFloat(hsl[4] ?? '1')
    return converted
  }

  return null
}

export function formatRgb(color: RgbColor) {
  return color.a < 1
    ? `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a.toFixed(2)})`
    : `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`
}

export function formatHsl(color: RgbColor) {
  const hsl = rgbToHsl(color)
  return color.a < 1 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${color.a.toFixed(2)})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

export function formatCmyk({ r, g, b }: RgbColor) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const black = 1 - Math.max(red, green, blue)
  if (black === 1) return 'cmyk(0%, 0%, 0%, 100%)'
  const cyan = (1 - red - black) / (1 - black)
  const magenta = (1 - green - black) / (1 - black)
  const yellow = (1 - blue - black) / (1 - black)
  return `cmyk(${Math.round(cyan * 100)}%, ${Math.round(magenta * 100)}%, ${Math.round(yellow * 100)}%, ${Math.round(black * 100)}%)`
}

export function readableTextColor({ r, g, b }: RgbColor) {
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.57 ? '#241F1B' : '#FFFDF8'
}
