import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from 'react'
import { Check, Clipboard, ImagePlus, Palette, Pipette, Trash2, Upload } from 'lucide-react'

import { formatHsl, formatRgb, readableTextColor, rgbToHex, type RgbColor } from '@/lib/color'
import { canvasPoint, extractPaletteFromPixels, scaledImageSize } from '@/lib/image-color'
import { Button } from '@/components/ui/button'

const INITIAL_PICK: RgbColor = { r: 196, g: 81, b: 50, a: 1 }

export default function ImageColorPicker() {
  const [imageUrl, setImageUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [picked, setPicked] = useState<RgbColor>(INITIAL_PICK)
  const [palette, setPalette] = useState<RgbColor[]>([])
  const [copied, setCopied] = useState('')
  const [dragging, setDragging] = useState(false)
  const [clipboardNotice, setClipboardNotice] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const magnifierRef = useRef<HTMLCanvasElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const image = new Image()
    image.onload = () => {
      const size = scaledImageSize(image.naturalWidth, image.naturalHeight)
      canvas.width = size.width
      canvas.height = size.height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      setPalette(extractPaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height))
      const center = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data
      setPicked({ r: center[0], g: center[1], b: center[2], a: center[3] / 255 })
    }
    image.src = imageUrl
    return () => { image.onload = null }
  }, [imageUrl])

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  function loadFile(file?: File) {
    if (!file || !file.type.startsWith('image/')) return
    setImageUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setClipboardNotice('')
  }

  useEffect(() => {
    function pasteImage(event: ClipboardEvent) {
      const items = event.clipboardData?.items
      if (!items) return
      const imageItem = [...items].find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      const file = imageItem?.getAsFile()
      if (!file) return
      event.preventDefault()
      loadFile(file)
      setFileName(file.name || 'Pasted image')
    }
    window.addEventListener('paste', pasteImage)
    return () => window.removeEventListener('paste', pasteImage)
  }, [])

  async function readClipboardImage() {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (!imageType) continue
        const blob = await item.getType(imageType)
        const extension = imageType.split('/')[1] || 'png'
        loadFile(new File([blob], `clipboard.${extension}`, { type: imageType }))
        setFileName('Pasted image')
        return
      }
      setClipboardNotice('No image found in the clipboard.')
    } catch {
      setClipboardNotice('Clipboard access was blocked. Press Ctrl+V instead.')
    }
  }

  function openImage(event: ChangeEvent<HTMLInputElement>) {
    loadFile(event.target.files?.[0])
    event.target.value = ''
  }

  function dropImage(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    loadFile(event.dataTransfer.files[0])
  }

  function pickPixel(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !context) return
    const bounds = canvas.getBoundingClientRect()
    const { x, y } = canvasPoint(event.clientX, event.clientY, bounds, canvas.width, canvas.height)
    const pixel = context.getImageData(x, y, 1, 1).data
    setPicked({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 })
  }

  function moveMagnifier(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const magnifier = magnifierRef.current
    const context = magnifier?.getContext('2d')
    if (!canvas || !magnifier || !context) return
    const bounds = canvas.getBoundingClientRect()
    const localX = event.clientX - bounds.left
    const localY = event.clientY - bounds.top
    const { x: pixelX, y: pixelY } = canvasPoint(event.clientX, event.clientY, bounds, canvas.width, canvas.height)
    const sampleSize = Math.min(11, canvas.width, canvas.height)
    const sourceX = Math.min(canvas.width - sampleSize, Math.max(0, pixelX - Math.floor(sampleSize / 2)))
    const sourceY = Math.min(canvas.height - sampleSize, Math.max(0, pixelY - Math.floor(sampleSize / 2)))
    const cellSize = magnifier.width / sampleSize

    context.clearRect(0, 0, magnifier.width, magnifier.height)
    context.imageSmoothingEnabled = false
    context.drawImage(canvas, sourceX, sourceY, sampleSize, sampleSize, 0, 0, magnifier.width, magnifier.height)
    context.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    context.lineWidth = 1
    for (let index = 1; index < sampleSize; index += 1) {
      const offset = Math.round(index * cellSize) + 0.5
      context.beginPath()
      context.moveTo(offset, 0)
      context.lineTo(offset, magnifier.height)
      context.moveTo(0, offset)
      context.lineTo(magnifier.width, offset)
      context.stroke()
    }

    const selectedX = (pixelX - sourceX) * cellSize
    const selectedY = (pixelY - sourceY) * cellSize
    context.strokeStyle = '#ffffff'
    context.lineWidth = 3
    context.strokeRect(selectedX + 1.5, selectedY + 1.5, cellSize - 3, cellSize - 3)
    context.strokeStyle = '#1f1b18'
    context.lineWidth = 1
    context.strokeRect(selectedX + 3.5, selectedY + 3.5, cellSize - 7, cellSize - 7)

    const magnifierSize = 132
    let left = localX + 18
    let top = localY + 18
    if (left + magnifierSize > bounds.width) left = localX - magnifierSize - 18
    if (top + magnifierSize > bounds.height) top = localY - magnifierSize - 18
    magnifier.style.left = `${Math.max(0, left)}px`
    magnifier.style.top = `${Math.max(0, top)}px`
    magnifier.style.display = 'block'
  }

  function hideMagnifier() {
    if (magnifierRef.current) magnifierRef.current.style.display = 'none'
  }

  async function copyColor(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  function clearImage() {
    setImageUrl('')
    setFileName('')
    setPalette([])
  }

  const values = [['HEX', rgbToHex(picked)], ['RGB', formatRgb(picked)], ['HSL', formatHsl(picked)]]

  return (
    <section className="image-picker-workspace">
      <div className="image-picker-toolbar"><div><Pipette /><span><strong>Pick from an image</strong><small>{clipboardNotice || fileName || 'Upload or paste a local image to begin'}</small></span></div><div><Button variant="outline" size="sm" onClick={() => void readClipboardImage()}><Clipboard /> Paste image</Button><Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}><Upload /> {imageUrl ? 'Replace' : 'Open image'}</Button><input ref={fileInput} hidden type="file" accept="image/*" onChange={openImage} />{imageUrl && <Button variant="ghost" size="sm" onClick={clearImage}><Trash2 /> Clear</Button>}</div></div>

      {!imageUrl ? <div className={`image-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={dropImage} onClick={() => fileInput.current?.click()}><span><ImagePlus /></span><h2>Drop, paste, or open an image</h2><p>Press Ctrl+V anywhere, or click to choose PNG, JPEG, WebP, GIF, or SVG</p><small>Images remain on this device</small></div> : <div className="image-picker-layout"><div className="canvas-stage"><div className="canvas-hint"><Pipette /> Hover to magnify, then click to sample a pixel</div><div className="canvas-container"><canvas className="source-canvas" ref={canvasRef} onClick={pickPixel} onMouseMove={moveMagnifier} onMouseLeave={hideMagnifier} aria-label="Uploaded image color sampling canvas" /><canvas className="pixel-magnifier" ref={magnifierRef} width="132" height="132" aria-hidden="true" /></div></div><aside className="picked-color-panel"><div className="picked-swatch" style={{ background: rgbToHex(picked), color: readableTextColor(picked) }}><Pipette /><strong>{rgbToHex(picked)}</strong></div><div className="picked-values">{values.map(([label, value]) => <button key={label} onClick={() => copyColor(label, value)}><span>{label}</span><code>{value}</code>{copied === label ? <Check /> : <Clipboard />}</button>)}</div><div className="image-palette"><div><Palette /><span><strong>Image palette</strong><small>Dominant sampled colors</small></span></div><div>{palette.map((color, index) => { const hex = rgbToHex(color); return <button key={`${hex}-${index}`} style={{ background: hex, color: readableTextColor(color) }} onClick={() => { setPicked(color); void copyColor(`image-${index}`, hex) }} title={hex}>{copied === `image-${index}` ? <Check /> : <span>{hex}</span>}</button> })}</div></div></aside></div>}
    </section>
  )
}
