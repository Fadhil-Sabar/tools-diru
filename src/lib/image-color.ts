import type { RgbColor } from '@/lib/color'

export function extractPaletteFromPixels(pixels: ArrayLike<number>, width: number, height: number) {
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 12000)))
  const colors = new Map<string, number>()
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const offset = (y * width + x) * 4
      if (pixels[offset + 3] < 160) continue
      const quantize = (value: number) => Math.min(255, Math.round(value / 32) * 32)
      const key = `${quantize(pixels[offset])},${quantize(pixels[offset + 1])},${quantize(pixels[offset + 2])}`
      colors.set(key, (colors.get(key) ?? 0) + 1)
    }
  }
  return [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key]): RgbColor => {
    const [r, g, b] = key.split(',').map(Number)
    return { r, g, b, a: 1 }
  })
}

export function scaledImageSize(width: number, height: number, maximum = 1600) {
  const scale = Math.min(1, maximum / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function canvasPoint(clientX: number, clientY: number, bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, width: number, height: number) {
  return {
    x: Math.min(width - 1, Math.max(0, Math.floor((clientX - bounds.left) * width / bounds.width))),
    y: Math.min(height - 1, Math.max(0, Math.floor((clientY - bounds.top) * height / bounds.height))),
  }
}
