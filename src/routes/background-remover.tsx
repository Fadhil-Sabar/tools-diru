import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Download, Eraser, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'

type RemovalModel = 'isnet_quint8' | 'isnet_fp16'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function outputName(fileName: string) {
  return `${fileName.replace(/\.[^.]+$/, '') || 'image'}-no-bg.png`
}

export default function BackgroundRemover() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [model, setModel] = useState<RemovalModel>('isnet_quint8')
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('Preparing local model')
  const [error, setError] = useState('')
  const [dimensions, setDimensions] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  }, [sourceUrl])

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  function loadFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose a PNG, JPEG, or WebP image.')
      return
    }
    setSourceFile(file)
    setSourceUrl(URL.createObjectURL(file))
    setResultUrl('')
    setDimensions('')
    setProgress(0)
    setError('')
  }

  useEffect(() => {
    function pasteImage(event: ClipboardEvent) {
      const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.kind === 'file' && entry.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (!file || processing) return
      event.preventDefault()
      loadFile(file)
    }
    window.addEventListener('paste', pasteImage)
    return () => window.removeEventListener('paste', pasteImage)
  }, [processing])

  function openImage(event: ChangeEvent<HTMLInputElement>) {
    loadFile(event.target.files?.[0])
    event.target.value = ''
  }

  function dropImage(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!processing) loadFile(event.dataTransfer.files[0])
  }

  async function removeBackground() {
    if (!sourceFile || processing) return
    setProcessing(true)
    setResultUrl('')
    setError('')
    setProgress(2)
    setProgressLabel('Loading removal engine')

    try {
      const { removeBackground: imglyRemoveBackground } = await import('@imgly/background-removal')
      const result = await imglyRemoveBackground(sourceFile, {
        model,
        output: { format: 'image/png', quality: 1 },
        progress: (key, current, total) => {
          const isModelAsset = /model|isnet|onnx/i.test(key)
          if (total > 0) {
            const assetProgress = current / total
            const nextProgress = isModelAsset ? 18 + assetProgress * 74 : 3 + assetProgress * 15
            setProgress((previous) => Math.max(previous, Math.round(nextProgress)))
          }
          setProgressLabel(isModelAsset ? 'Downloading AI model' : 'Preparing removal engine')
        },
      })
      setProgressLabel('Finishing transparent PNG')
      setProgress(96)
      setResultUrl(URL.createObjectURL(result))
      setProgress(100)
    } catch (reason) {
      console.error(reason)
      setError('Background removal failed. Check your connection for the first-time model download, then try again.')
      setProgress(0)
    } finally {
      setProcessing(false)
    }
  }

  function clearImage() {
    if (processing) return
    setSourceFile(null)
    setSourceUrl('')
    setResultUrl('')
    setDimensions('')
    setError('')
    setProgress(0)
  }

  function downloadResult() {
    if (!resultUrl || !sourceFile) return
    const anchor = document.createElement('a')
    anchor.href = resultUrl
    anchor.download = outputName(sourceFile.name)
    anchor.click()
  }

  const fileMeta = sourceFile ? [dimensions, formatBytes(sourceFile.size)].filter(Boolean).join(' · ') : ''

  return (
    <section className="background-remover-workspace">
      <header className="background-remover-toolbar">
        <div className="background-remover-title"><Eraser /><span><strong>Background remover</strong><small>{sourceFile ? `${sourceFile.name}${fileMeta ? ` · ${fileMeta}` : ''}` : 'A clean cutout, made on this device'}</small></span></div>
        <div className="background-remover-actions">
          <label className="removal-model-select"><span>Model</span><select name="removal-model" value={model} onChange={(event) => setModel(event.target.value as RemovalModel)} disabled={processing}><option value="isnet_quint8">Fast · 40 MB</option><option value="isnet_fp16">Fine edges · 80 MB</option></select></label>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={processing}><Upload /> {sourceFile ? 'Replace' : 'Open image'}</Button>
          {sourceFile && <Button variant="ghost" size="sm" onClick={clearImage} disabled={processing}><Trash2 /> Clear</Button>}
          <input ref={inputRef} hidden type="file" name="source-image" accept="image/png,image/jpeg,image/webp" onChange={openImage} />
        </div>
      </header>

      {!sourceFile ? (
        <div className={`background-remover-dropzone ${dragging ? 'dragging' : ''}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click() }} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={dropImage}>
          <div className="cutout-mark"><ImagePlus /><span /></div>
          <p className="dropzone-kicker">Local AI cutout</p>
          <h2>Give your subject some breathing room.</h2>
          <p>Drop an image here, paste from your clipboard, or click to browse.</p>
          <div className="privacy-stamp"><ShieldCheck /> Your image never leaves this device</div>
        </div>
      ) : (
        <div className="background-remover-editor">
          <div className="removal-preview-grid">
            <figure className="removal-preview source-preview"><figcaption><span>01</span> Original</figcaption><div><img src={sourceUrl} alt="Original upload" onLoad={(event) => setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)} /></div></figure>
            <figure className="removal-preview result-preview"><figcaption><span>02</span> Transparent cutout</figcaption><div className="checkerboard">{resultUrl ? <img src={resultUrl} alt="Image with its background removed" /> : <div className="result-placeholder">{processing ? <><LoaderCircle className="processing-spinner" /><strong>Finding the edges</strong><small>{progressLabel}</small></> : <><Sparkles /><strong>Ready for the clean cut</strong><small>Choose a model, then remove the background.</small></>}</div>}</div></figure>
          </div>

          <footer className="removal-command-bar">
            <div className="removal-status">{processing ? <><span className="removal-progress"><i style={{ width: `${progress}%` }} /></span><small>{progress}% · First use downloads the model once</small></> : resultUrl ? <><ShieldCheck /><span><strong>Cutout complete</strong><small>Transparent PNG · processed locally</small></span></> : <><Sparkles /><span><strong>Ready to process</strong><small>Works best with a clearly defined subject</small></span></>}</div>
            <div>{resultUrl && <Button variant="outline" onClick={() => void removeBackground()} disabled={processing}><RefreshCw /> Run again</Button>}<Button onClick={resultUrl ? downloadResult : () => void removeBackground()} disabled={processing}>{processing ? <><LoaderCircle className="processing-spinner" /> Removing background</> : resultUrl ? <><Download /> Download PNG</> : <><Eraser /> Remove background</>}</Button></div>
          </footer>
        </div>
      )}

      {error && <div className="background-remover-error" role="alert">{error}</div>}
    </section>
  )
}
