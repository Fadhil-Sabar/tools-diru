import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Braces, FileText, Gauge, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'

import { Button } from '@/components/ui/button'

hljs.registerLanguage('typescript', typescript)

type Preset = 'text' | 'code'
type PlaybackState = 'idle' | 'running' | 'paused' | 'complete'

const TEXT_SAMPLE = `Good interfaces make complex systems feel calm. They reveal the right detail at the right moment, respond without hesitation, and help people stay oriented as the work unfolds. A streaming response should feel equally deliberate: quick enough to maintain momentum, measured enough to remain readable, and clear about the progress still ahead.`

const CODE_SAMPLE = `Here is a small TypeScript helper that keeps an animation value within a safe range.

\`\`\`typescript
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const speed = clamp(requestedSpeed, 1, 2000)
\`\`\`

The same guard can be reused for sliders, generated values, and any input that needs predictable boundaries.`

function tokenize(value: string): string[] {
  const parts = value.match(/[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s\w]|\s+/g) ?? []
  const tokens: string[] = []

  for (const part of parts) {
    if (/^\s+$/.test(part) && tokens.length > 0) tokens[tokens.length - 1] += part
    else if (!/^\s+$/.test(part)) tokens.push(part)
  }

  return tokens
}

function fitTokens(source: string, length: number): string[] {
  const sourceTokens = tokenize(source)
  if (sourceTokens.length === 0) return []
  return Array.from({ length }, (_, index) => sourceTokens[index % sourceTokens.length])
}

function MixedPreview({ value }: { value: string }) {
  const segments: Array<{ type: 'prose' | 'code'; value: string }> = []
  let offset = 0

  while (offset < value.length) {
    const fenceStart = value.indexOf('```', offset)
    if (fenceStart === -1) {
      segments.push({ type: 'prose', value: value.slice(offset) })
      break
    }

    const headerEnd = value.indexOf('\n', fenceStart)
    if (headerEnd === -1) {
      segments.push({ type: 'prose', value: value.slice(offset) })
      break
    }

    if (fenceStart > offset) segments.push({ type: 'prose', value: value.slice(offset, fenceStart) })
    const fenceEnd = value.indexOf('```', headerEnd + 1)
    const codeEnd = fenceEnd === -1 ? value.length : fenceEnd
    segments.push({ type: 'code', value: value.slice(headerEnd + 1, codeEnd) })
    offset = fenceEnd === -1 ? value.length : fenceEnd + 3
  }

  return (
    <div className="token-mixed-output">
      {segments.map((segment, index) => segment.type === 'code' ? (
        <code
          className="hljs language-typescript"
          dangerouslySetInnerHTML={{ __html: hljs.highlight(segment.value, { language: 'typescript' }).value }}
          key={index}
        />
      ) : <span className="token-prose" key={index}>{segment.value}</span>)}
      <span className="token-cursor" aria-hidden="true" />
    </div>
  )
}

export default function TokenVisualizer() {
  const [preset, setPreset] = useState<Preset>('text')
  const [source, setSource] = useState(TEXT_SAMPLE)
  const [speed, setSpeed] = useState(24)
  const [length, setLength] = useState(180)
  const [displayedCount, setDisplayedCount] = useState(0)
  const [playback, setPlayback] = useState<PlaybackState>('idle')
  const frameRef = useRef<number | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const runStartRef = useRef(0)
  const countStartRef = useRef(0)

  const streamTokens = useMemo(() => fitTokens(source, length), [length, source])
  const visibleText = useMemo(() => streamTokens.slice(0, displayedCount).join(''), [displayedCount, streamTokens])
  const progress = streamTokens.length === 0 ? 0 : displayedCount / streamTokens.length
  const remainingSeconds = speed > 0 ? Math.max(0, streamTokens.length - displayedCount) / speed : 0

  useEffect(() => {
    const output = outputRef.current
    if (output) output.scrollTop = output.scrollHeight
  }, [displayedCount])

  useEffect(() => {
    if (playback !== 'running') return

    runStartRef.current = performance.now()
    countStartRef.current = displayedCount

    function animate(now: number) {
      const elapsedSeconds = (now - runStartRef.current) / 1000
      const nextCount = Math.min(streamTokens.length, countStartRef.current + Math.floor(elapsedSeconds * speed))
      setDisplayedCount(nextCount)

      if (nextCount >= streamTokens.length) {
        setPlayback('complete')
        frameRef.current = null
        return
      }
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [playback, speed, streamTokens.length])

  function reset() {
    setDisplayedCount(0)
    setPlayback('idle')
  }

  function choosePreset(nextPreset: Preset) {
    setPreset(nextPreset)
    setSource(nextPreset === 'text' ? TEXT_SAMPLE : CODE_SAMPLE)
    reset()
  }

  function updateSource(event: ChangeEvent<HTMLTextAreaElement>) {
    setSource(event.target.value)
    reset()
  }

  function updateLength(value: number) {
    setLength(Math.min(1200, Math.max(20, value)))
    reset()
  }

  function togglePlayback() {
    if (playback === 'running') {
      setPlayback('paused')
      return
    }
    if (playback === 'complete') setDisplayedCount(0)
    setPlayback('running')
  }

  return (
    <div className="token-tool">
      <section className="token-workspace">
        <aside className="token-controls" aria-label="Visualizer controls">
          <div className="token-control-heading">
            <span>01</span>
            <div><strong>Configure stream</strong><small>Adjust while it runs</small></div>
          </div>

          <fieldset className="token-presets">
            <legend>Content preset</legend>
            <button className={preset === 'text' ? 'active' : ''} onClick={() => choosePreset('text')}>
              <FileText /><span><strong>Text only</strong><small>Natural language</small></span>
            </button>
            <button className={preset === 'code' ? 'active' : ''} onClick={() => choosePreset('code')}>
              <Braces /><span><strong>Code + text</strong><small>Mixed response</small></span>
            </button>
          </fieldset>

          <label className="token-range-control">
            <span><span><Gauge /> Speed</span><output>{speed} tok/s</output></span>
            <input type="range" min="1" max="2000" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
            <small><span>1</span><span>2,000</span></small>
          </label>

          <label className="token-range-control">
            <span><span><FileText /> Text length</span><output>{length} tokens</output></span>
            <input type="range" min="20" max="1200" step="10" value={length} onChange={(event) => updateLength(Number(event.target.value))} />
            <small><span>20</span><span>1,200</span></small>
          </label>

          <label className="token-source">
            <span>Source material</span>
            <textarea value={source} onChange={updateSource} spellCheck={false} aria-label="Source material for the token stream" />
          </label>
        </aside>

        <div className="token-stage">
          <header className="token-stage-header">
            <div className={`token-status ${playback}`}><i />{playback === 'idle' ? 'Ready' : playback}</div>
            <div className="token-stage-actions">
              <Button variant="outline" onClick={reset} disabled={displayedCount === 0 && playback === 'idle'}><RotateCcw /> Reset</Button>
              <Button onClick={togglePlayback} disabled={streamTokens.length === 0}>
                {playback === 'running' ? <><Pause /> Pause</> : <><Play /> {playback === 'complete' ? 'Replay' : playback === 'paused' ? 'Resume' : 'Start stream'}</>}
              </Button>
            </div>
          </header>

          <div ref={outputRef} className={`token-output ${preset === 'code' ? 'code-mode' : ''}`} aria-label="Streaming token preview">
            {visibleText ? preset === 'code' ? <MixedPreview value={visibleText} /> : <pre>{visibleText}<span className="token-cursor" aria-hidden="true" /></pre> : (
              <div className="token-empty"><Sparkles /><strong>Ready to stream</strong><span>Press start to watch the response arrive.</span></div>
            )}
          </div>

          <footer className="token-meter">
            <div className="token-progress-track"><span style={{ transform: `scaleX(${progress})` }} /></div>
            <dl>
              <div><dt>Rendered</dt><dd>{displayedCount}<span> / {streamTokens.length}</span></dd></div>
              <div><dt>Elapsed</dt><dd>{(displayedCount / speed).toFixed(1)}<span>s</span></dd></div>
              <div><dt>Remaining</dt><dd>{remainingSeconds.toFixed(1)}<span>s</span></dd></div>
              <div><dt>Progress</dt><dd>{Math.round(progress * 100)}<span>%</span></dd></div>
            </dl>
          </footer>
        </div>
      </section>
    </div>
  )
}
