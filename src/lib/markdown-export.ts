import type { MarkdownSettings } from './markdown'
import { inlineMarkdownImages } from './markdown-images'
import { pageDimensions, renderMarkdown } from './markdown'

export interface PrintOptions {
  headerText: string
  footerText: string
  showPageNumbers: boolean
  showDate: boolean
  includeCodeBackground: boolean
}

function htmlText(html: string, selector: string) {
  return new DOMParser().parseFromString(html, 'text/html').querySelector(selector)?.textContent?.trim() ?? ''
}

function cssString(value: string) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', ' ')}"`
}

function tokenContent(value: string, title: string, includePages: boolean) {
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())
  const parts = value.split(/(\{title\}|\{date\}|\{page\}|\{total\})/g).filter(Boolean)
  return parts.map((part) => {
    if (part === '{title}') return cssString(title)
    if (part === '{date}') return cssString(date)
    if (part === '{page}') return includePages ? 'counter(page)' : '""'
    if (part === '{total}') return includePages ? 'counter(pages)' : '""'
    return cssString(part)
  }).join(' ')
}

function collectRenderedStyles() {
  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule.cssText.includes('.katex') || rule.cssText.includes('.hljs')) rules.push(rule.cssText)
      }
    } catch {
      // Cross-origin stylesheets are intentionally skipped.
    }
  }
  return rules.join('\n')
}

function printCss(settings: MarkdownSettings, options: PrintOptions, title: string) {
  const dimensions = pageDimensions(settings.pageSize, settings.landscape)
  const bodyFont = settings.customBodyFont || settings.bodyFont
  const headingFont = settings.customHeadingFont || settings.headingFont
  const codeFont = settings.customCodeFont || settings.codeFont
  const header = tokenContent(options.headerText, title, options.showPageNumbers)
  const footer = tokenContent(options.footerText, title, options.showPageNumbers)
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())
  return `
    @page {
      size: ${dimensions.width}mm ${dimensions.height}mm;
      margin: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm;
      @top-center { content: ${options.headerText ? header : 'none'}; font: 9pt sans-serif; color: #756d64; }
      @bottom-center { content: ${options.footerText ? footer : 'none'}; font: 9pt sans-serif; color: #756d64; }
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fffefa; color: #28231f; }
    body { font: ${settings.fontSize}pt/${settings.lineHeight} "${bodyFont}", Georgia, serif; }
    body::before { content: ${options.showDate ? cssString(date) : 'none'}; display: block; margin-bottom: 12pt; color: #756d64; text-align: right; font: 9pt sans-serif; }
    h1, h2, h3, h4, h5, h6 { font-family: "${headingFont}", Georgia, serif; line-height: 1.2; page-break-after: avoid; break-after: avoid-page; }
    h1 { padding-bottom: .3em; border-bottom: 2px solid #28231f; font-size: 2em; }
    h2 { font-size: 1.5em; } h3 { font-size: 1.2em; }
    p { margin: 0 0 ${settings.paragraphSpacing}px; }
    a { color: #8d3927; text-decoration: underline; }
    ul, ol { padding-left: 1.7em; }
    blockquote { margin-left: 0; padding: .6em 1em; border-left: 3px solid #a84a32; background: #f5efe7; color: #5d5148; }
    code, pre { font-family: "${codeFont}", monospace; }
    code { font-size: .86em; }
    pre { padding: 10pt; overflow-wrap: anywhere; white-space: pre-wrap; border: 1px solid #d8d0c5; background: ${options.includeCodeBackground ? '#f3eee7' : 'transparent'} !important; }
    pre code, .hljs { background: transparent !important; }
    table { width: 100%; border-collapse: collapse; } th, td { padding: 5pt 7pt; border: 1px solid #cfc6ba; text-align: left; } th { background: #eee8df; }
    img { max-width: 100%; height: auto; }
    pre, blockquote, table, figure, img, .katex-display { break-inside: avoid-page; page-break-inside: avoid; }
    .task-list-item { list-style: none; } .task-list-item input { margin-right: .45em; }
  `
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

async function waitForPrintAssets(printWindow: Window) {
  const images = Array.from(printWindow.document.images)
  await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })))
  await printWindow.document.fonts?.ready
}

export async function printMarkdown(markdown: string, settings: MarkdownSettings, options: PrintOptions) {
  const printWindow = window.open('', '_blank', 'popup,width=900,height=700')
  if (!printWindow) throw new Error('Pop-up blocked. Allow pop-ups to print this document.')
  try {
    printWindow.document.write('<p style="font-family:sans-serif;padding:2rem">Preparing document…</p>')
    const portable = await inlineMarkdownImages(markdown)
    const html = renderMarkdown(portable)
    const title = htmlText(html, 'h1') || 'Untitled document'
    printWindow.document.open()
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${collectRenderedStyles()}\n${printCss(settings, options, title)}</style></head><body>${html}</body></html>`)
    printWindow.document.close()
    await waitForPrintAssets(printWindow)
    printWindow.focus()
    printWindow.print()
  } catch (error) {
    printWindow.close()
    throw error
  }
}

function styledRichHtml(html: string, settings: MarkdownSettings) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const bodyFont = settings.customBodyFont || settings.bodyFont
  const headingFont = settings.customHeadingFont || settings.headingFont
  const codeFont = settings.customCodeFont || settings.codeFont
  documentNode.body.style.cssText = `font-family:${bodyFont},serif;font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};color:#28231f`
  documentNode.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((element) => element.setAttribute('style', `font-family:${headingFont},serif;line-height:1.2`))
  documentNode.querySelectorAll('p').forEach((element) => element.setAttribute('style', `margin:0 0 ${settings.paragraphSpacing}px`))
  documentNode.querySelectorAll('code,pre').forEach((element) => element.setAttribute('style', `font-family:${codeFont},monospace;background:#f3eee7`))
  documentNode.querySelectorAll('table').forEach((element) => element.setAttribute('style', 'border-collapse:collapse;width:100%'))
  documentNode.querySelectorAll('th,td').forEach((element) => element.setAttribute('style', 'border:1px solid #cfc6ba;padding:6px 10px;text-align:left'))
  return documentNode.body.outerHTML
}

export async function copyMarkdown(markdown: string) {
  const portable = await inlineMarkdownImages(markdown)
  await navigator.clipboard.writeText(portable)
}

export async function copyRichText(markdown: string, settings: MarkdownSettings) {
  const portable = await inlineMarkdownImages(markdown)
  const html = renderMarkdown(portable)
  const rich = styledRichHtml(html, settings)
  const plain = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([rich], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    })])
    return
  }
  await navigator.clipboard.writeText(plain)
}
