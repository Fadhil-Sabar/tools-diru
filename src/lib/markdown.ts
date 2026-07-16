export type PaperSize = 'a4' | 'letter'

export function markdownStats(markdown: string) {
  const words = (markdown.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length
  return { words, pages: Math.max(1, Math.ceil(words / 500)) }
}

export function wrapSelection(markdown: string, start: number, end: number, prefix: string, suffix: string, placeholder: string) {
  const selected = markdown.slice(start, end) || placeholder
  return {
    value: `${markdown.slice(0, start)}${prefix}${selected}${suffix}${markdown.slice(end)}`,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + selected.length,
  }
}

export function prefixSelectedLines(markdown: string, selectionStart: number, selectionEnd: number, prefix: string) {
  const start = markdown.lastIndexOf('\n', selectionStart - 1) + 1
  const endBreak = markdown.indexOf('\n', selectionEnd)
  const end = endBreak === -1 ? markdown.length : endBreak
  const selected = markdown.slice(start, end) || 'List item'
  const replacement = selected.split('\n').map((line) => `${prefix}${line}`).join('\n')
  return `${markdown.slice(0, start)}${replacement}${markdown.slice(end)}`
}

export function pdfFilename(title: string) {
  return `${title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'document'}.pdf`
}

export function pdfOptions(title: string, paper: PaperSize) {
  return {
    margin: paper === 'a4' ? 12 : 13,
    filename: pdfFilename(title),
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: paper, orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }
}
