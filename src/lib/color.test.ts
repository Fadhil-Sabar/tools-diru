import { describe, expect, it } from 'vitest'

import { formatCmyk, formatHsl, formatRgb, hslToRgb, parseColor, readableTextColor, rgbToHex, rgbToHsl } from './color'

describe('color converter', () => {
  it('parses supported HEX, RGB, and HSL forms', () => {
    expect(parseColor('#C45132')).toEqual({ r: 196, g: 81, b: 50, a: 1 })
    expect(parseColor('#0F08')).toEqual({ r: 0, g: 255, b: 0, a: 136 / 255 })
    expect(parseColor('rgba(300, 10, 20, 50%)')).toEqual({ r: 255, g: 10, b: 20, a: 0.5 })
    expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
    expect(parseColor('invalid')).toBeNull()
  })

  it('converts primary colors and wraps hue', () => {
    const red = { r: 255, g: 0, b: 0, a: 1 }
    expect(rgbToHsl(red)).toEqual({ h: 0, s: 100, l: 50 })
    expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255, a: 1 })
    expect(rgbToHex(red)).toBe('#FF0000')
  })

  it('formats values and chooses readable contrast', () => {
    const color = { r: 0, g: 0, b: 0, a: 0.5 }
    expect(formatRgb(color)).toBe('rgba(0, 0, 0, 0.50)')
    expect(formatHsl(color)).toBe('hsla(0, 0%, 0%, 0.50)')
    expect(formatCmyk(color)).toBe('cmyk(0%, 0%, 0%, 100%)')
    expect(readableTextColor(color)).toBe('#FFFDF8')
    expect(readableTextColor({ r: 255, g: 255, b: 255, a: 1 })).toBe('#241F1B')
  })
})
