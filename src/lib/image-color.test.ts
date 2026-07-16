import { describe, expect, it } from 'vitest'

import { canvasPoint, extractPaletteFromPixels, scaledImageSize } from './image-color'

describe('image color picker', () => {
  it('quantizes, ranks, and ignores transparent pixels', () => {
    const pixels = new Uint8ClampedArray([
      250, 10, 10, 255,
      248, 12, 12, 255,
      0, 250, 0, 255,
      0, 0, 255, 100,
    ])
    expect(extractPaletteFromPixels(pixels, 4, 1)).toEqual([
      { r: 255, g: 0, b: 0, a: 1 },
      { r: 0, g: 255, b: 0, a: 1 },
    ])
  })

  it('scales large images without enlarging small ones', () => {
    expect(scaledImageSize(3200, 1600)).toEqual({ width: 1600, height: 800 })
    expect(scaledImageSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('maps and clamps display coordinates to canvas pixels', () => {
    const bounds = { left: 10, top: 20, width: 200, height: 100 }
    expect(canvasPoint(110, 70, bounds, 1000, 500)).toEqual({ x: 500, y: 250 })
    expect(canvasPoint(-20, 999, bounds, 1000, 500)).toEqual({ x: 0, y: 499 })
  })
})
