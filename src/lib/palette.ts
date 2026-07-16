import { hslToRgb, rgbToHex, type RgbColor } from '@/lib/color'

export type PaletteExportFormat = 'css' | 'json' | 'tailwind' | 'scss'
export type PaletteHarmony = 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'monochrome'

export function hashSeed(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  return Math.abs(hash)
}

export function createRng(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }
}

export function generatePalette(seed: string, count: number, harmony: PaletteHarmony = 'analogous'): RgbColor[] {
  const rng = createRng(hashSeed(seed))
  const baseHue = rng() * 360
  const harmonyOffsets: Record<Exclude<PaletteHarmony, 'analogous' | 'monochrome'>, number[]> = {
    complementary: [0, 180],
    triadic: [0, 120, 240],
    tetradic: [0, 90, 180, 270],
  }
  return Array.from({ length: count }, (_, index) => {
    const position = count === 1 ? 0 : index / (count - 1)
    if (harmony === 'monochrome') return hslToRgb({ h: Math.round(baseHue), s: Math.round(48 + rng() * 20), l: Math.round(20 + position * 65) })
    if (harmony === 'analogous') {
      const hue = baseHue - 55 + position * 110
      return hslToRgb({ h: Math.round(hue), s: Math.round(50 + rng() * 22), l: Math.round(34 + rng() * 30) })
    }
    const offsets = harmonyOffsets[harmony]
    const cycle = Math.floor(index / offsets.length)
    const hue = baseHue + offsets[index % offsets.length] + cycle * 9
    const lightnessBand = index % 2 === 0 ? 38 : 62
    return hslToRgb({ h: Math.round(hue), s: Math.round(52 + rng() * 22), l: Math.round(lightnessBand + (rng() - 0.5) * 12) })
  })
}

export function randomSeed(randomValues: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> = (bytes) => crypto.getRandomValues(bytes)) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return [...randomValues(new Uint8Array(10))].map((byte) => chars[byte % chars.length]).join('')
}

export function exportPalette(colors: RgbColor[], format: PaletteExportFormat) {
  if (format === 'css') return `:root {\n${colors.map((color, index) => `  --palette-${index + 1}: ${rgbToHex(color)};`).join('\n')}\n}`
  if (format === 'json') return JSON.stringify(colors.map((color) => rgbToHex(color)), null, 2)
  if (format === 'scss') return colors.map((color, index) => `$palette-${index + 1}: ${rgbToHex(color)};`).join('\n')
  const entries = colors.map((color, index) => `      '${(index + 1) * 100}': '${rgbToHex(color)}'`).join(',\n')
  return `{\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        }\n      }\n    }\n  }\n}`
}
