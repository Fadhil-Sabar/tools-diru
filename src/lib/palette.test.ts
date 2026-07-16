import { describe, expect, it } from 'vitest'

import { createRng, exportPalette, generatePalette, hashSeed, randomSeed } from './palette'

describe('color palette generator', () => {
  it('generates deterministic palettes for every harmony', () => {
    const first = generatePalette('toolbox', 5, 'triadic')
    expect(generatePalette('toolbox', 5, 'triadic')).toEqual(first)
    expect(generatePalette('different', 5, 'triadic')).not.toEqual(first)
    expect(generatePalette('toolbox', 3, 'monochrome')).toHaveLength(3)
  })

  it('hashes and produces repeatable random values', () => {
    expect(hashSeed('same')).toBe(hashSeed('same'))
    const first = createRng(42)
    const second = createRng(42)
    expect([first(), first()]).toEqual([second(), second()])
  })

  it('creates a ten-character seed from supplied random bytes', () => {
    expect(randomSeed((bytes) => bytes.fill(0))).toBe('aaaaaaaaaa')
  })

  it('exports CSS, JSON, Tailwind, and SCSS', () => {
    const colors = [{ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 255, b: 0, a: 1 }]
    expect(exportPalette(colors, 'css')).toContain('--palette-1: #FF0000;')
    expect(JSON.parse(exportPalette(colors, 'json'))).toEqual(['#FF0000', '#00FF00'])
    expect(exportPalette(colors, 'tailwind')).toContain("'200': '#00FF00'")
    expect(exportPalette(colors, 'scss')).toContain('$palette-2: #00FF00;')
  })
})
