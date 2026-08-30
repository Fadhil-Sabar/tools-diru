import { ChevronRight, QrCode } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import type { Tool } from '@/lib/tools'
import { TOOLS } from '@/lib/tools'

export default function Dashboard() {
  const navigate = useNavigate()
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="dashboard">
      <section className="dashboard-intro">
        <div><p className="eyebrow">{today}</p><h1>What are we<br /><em>solving today?</em></h1></div>
        <div className="tool-total"><strong>{TOOLS.length.toString().padStart(2, '0')}</strong><span>tools in<br />your workspace</span></div>
      </section>

      <section className="catalog-heading">
        <div><p className="eyebrow">Quick access</p><h2>Your everyday utilities</h2></div>
        <p>Small, focused, and private by default.</p>
      </section>

      <div className="tool-grid">
        {TOOLS.map((tool, index) => <ToolCard key={tool.id} tool={tool} featured={index === 0} onOpen={(tool) => navigate({ to: tool.path })} />)}
      </div>
    </div>
  )
}

function ToolCard({ tool, featured, onOpen }: { tool: Tool; featured: boolean; onOpen: (tool: Tool) => void }) {
  const Icon = tool.icon
  return (
    <article className={`tool-card ${featured ? 'featured' : ''}`} data-accent={tool.accent}>
      <div className="card-meta"><span>{tool.category}</span><span>{tool.available ? 'Ready' : 'Planned'}</span></div>
      <div className="card-preview" aria-hidden="true"><ToolPreview id={tool.id} /></div>
      <div className="card-copy">
        <span className="tool-icon"><Icon /></span>
        <div><h3>{tool.name}</h3><p>{tool.description}</p></div>
      </div>
      <button onClick={() => onOpen(tool)}>
        {tool.available ? 'Open tool' : 'Preview tool'} <ChevronRight />
      </button>
    </article>
  )
}

function ToolPreview({ id }: { id: Tool['id'] }) {
  if (id === 'diff') return <div className="preview-diff"><span>12</span><code>  const status = 'idle'</code><span>12</span><code>+ const status = 'ready'</code><span>13</span><code>+ return status</code></div>
  if (id === 'json') return <div className="preview-json"><code>{`{`}</code><code>  "name": "Toolbox",</code><code>  "private": true</code><code>{`}`}</code></div>
  if (id === 'timestamp') return <div className="preview-time"><strong>09:41</strong><span>Thursday · 16 Jul 2026</span></div>
  if (id === 'text') return <div className="preview-text"><span>Words<strong>248</strong></span><span>Lines<strong>32</strong></span><span>Chars<strong>1,892</strong></span></div>
  if (id === 'uuid') return <div className="preview-uuid"><code>7d444840</code><code>-9dc0-</code><code>11d1</code></div>
  if (id === 'markdown') return <div className="preview-markdown"><div><strong>A small document</strong><span /><span /><span /></div><code># Write<br /><br />**Preview**<br />then export.</code></div>
  if (id === 'sql') return <div className="preview-sql"><code><b>SELECT</b> u.name,</code><code>  COUNT(o.id)</code><code><b>FROM</b> users u</code><code><b>LEFT JOIN</b> orders o</code></div>
  if (id === 'csv') return <div className="preview-data"><div><b>{`{ }`}</b><span>JSON</span></div><i>↔</i><div><b>▦</b><span>CSV</span></div></div>
  if (id === 'color') return <div className="preview-colors"><span style={{ background: '#C45132' }} /><span style={{ background: '#D68A42' }} /><span style={{ background: '#4F8069' }} /><code>#C45132</code></div>
  if (id === 'image-color') return <div className="preview-image-color"><div /><span style={{ background: '#D7A45B' }} /><span style={{ background: '#4D6C78' }} /><span style={{ background: '#A94D3D' }} /></div>
  if (id === 'palette') return <div className="preview-palette"><span style={{ background: '#6B4C9A' }} /><span style={{ background: '#3B82A0' }} /><span style={{ background: '#48A87D' }} /><span style={{ background: '#D4A843' }} /><span style={{ background: '#C75D52' }} /></div>
  if (id === 'qr-code') return <div className="preview-qr"><QrCode /><span>Matrix 2D</span></div>
  return <div className="preview-image-color"><div /><span style={{ background: '#D7A45B' }} /><span style={{ background: '#4D6C78' }} /><span style={{ background: '#A94D3D' }} /></div>
}
