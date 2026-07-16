import { useState } from 'react'
import { FileDown, X } from 'lucide-react'

import type { MarkdownSettings } from '@/lib/markdown'
import type { PrintOptions } from '@/lib/markdown-export'

interface MarkdownExportDialogProps {
  fileName: string
  settings: MarkdownSettings
  onClose: () => void
  onExport: (options: PrintOptions) => Promise<void>
}

export default function MarkdownExportDialog({ fileName, settings, onClose, onExport }: MarkdownExportDialogProps) {
  const [options, setOptions] = useState<PrintOptions>({
    headerText: '{title}',
    footerText: '{page} / {total}',
    showPageNumbers: true,
    showDate: false,
    includeCodeBackground: true,
  })
  const [printing, setPrinting] = useState(false)
  const update = (partial: Partial<PrintOptions>) => setOptions((current) => ({ ...current, ...partial }))

  async function exportDocument() {
    setPrinting(true)
    try {
      await onExport(options)
      onClose()
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="markdown-dialog-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="markdown-dialog" role="dialog" aria-modal="true" aria-labelledby="markdown-export-title">
        <div className="markdown-dialog-heading"><div><FileDown /><div><h2 id="markdown-export-title">Print or export PDF</h2><p>{fileName} · {settings.pageSize} · {settings.landscape ? 'landscape' : 'portrait'}</p></div></div><button onClick={onClose} aria-label="Close export dialog"><X /></button></div>
        <div className="markdown-dialog-body">
          <label><span>Header <small>{'{title} {date}'}</small></span><input value={options.headerText} onChange={(event) => update({ headerText: event.target.value })} placeholder="{title}" /></label>
          <label><span>Footer <small>{'{page} {total} {date}'}</small></span><input value={options.footerText} onChange={(event) => update({ footerText: event.target.value })} placeholder="{page} / {total}" /></label>
          <label className="markdown-toggle"><span>Page numbers</span><input type="checkbox" checked={options.showPageNumbers} onChange={(event) => update({ showPageNumbers: event.target.checked })} /></label>
          <label className="markdown-toggle"><span>Generation date</span><input type="checkbox" checked={options.showDate} onChange={(event) => update({ showDate: event.target.checked })} /></label>
          <label className="markdown-toggle"><span>Code backgrounds</span><input type="checkbox" checked={options.includeCodeBackground} onChange={(event) => update({ includeCodeBackground: event.target.checked })} /></label>
          <p className="markdown-dialog-note">Your browser print dialog opens next. Choose “Save as PDF” to create a file.</p>
        </div>
        <div className="markdown-dialog-actions"><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => void exportDocument()} disabled={printing}><FileDown />{printing ? 'Preparing…' : 'Open print dialog'}</button></div>
      </section>
    </div>
  )
}
