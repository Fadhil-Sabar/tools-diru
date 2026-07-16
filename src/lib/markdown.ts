import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import type { RuleBlock } from 'markdown-it/lib/parser_block.mjs'
import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'

export type PaperSize = 'a4' | 'letter' | 'legal' | 'a5'
export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A5'
export type MarginPreset = 'normal' | 'narrow' | 'wide' | 'custom'

export interface MarkdownSettings {
  bodyFont: string
  headingFont: string
  codeFont: string
  customBodyFont: string
  customHeadingFont: string
  customCodeFont: string
  fontSize: number
  lineHeight: number
  paragraphSpacing: number
  pageSize: PageSize
  landscape: boolean
  marginPreset: MarginPreset
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  previewDark: boolean
}

export const DEFAULT_MARKDOWN_SETTINGS: MarkdownSettings = {
  bodyFont: 'Newsreader Variable',
  headingFont: 'Newsreader Variable',
  codeFont: 'IBM Plex Mono',
  customBodyFont: '',
  customHeadingFont: '',
  customCodeFont: '',
  fontSize: 12,
  lineHeight: 1.6,
  paragraphSpacing: 12,
  pageSize: 'A4',
  landscape: false,
  marginPreset: 'normal',
  marginTop: 25,
  marginRight: 25,
  marginBottom: 25,
  marginLeft: 25,
  previewDark: false,
}

const escapeMarkdownHtml = new MarkdownIt().utils.escapeHtml
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string): string {
    const value = language && hljs.getLanguage(language)
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : escapeMarkdownHtml(code)
    return `<pre class="hljs"><code>${value}</code></pre>`
  },
})

md.use(taskLists, { enabled: true, label: true, labelAfter: false })

function escapedAt(source: string, position: number) {
  let slashes = 0
  for (let index = position - 1; index >= 0 && source[index] === '\\'; index--) slashes++
  return slashes % 2 === 1
}

const mathInlineRule: RuleInline = (state, silent) => {
  const start = state.pos
  if (state.src[start] !== '$' || state.src[start + 1] === '$' || escapedAt(state.src, start)) return false
  let end = start + 1
  while ((end = state.src.indexOf('$', end)) !== -1) {
    if (!escapedAt(state.src, end)) break
    end++
  }
  if (end < 0 || end === start + 1 || /\s$/.test(state.src.slice(start + 1, end))) return false
  if (/\d/.test(state.src[start + 1] ?? '') && /\d/.test(state.src[end + 1] ?? '')) return false
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = state.src.slice(start + 1, end)
  }
  state.pos = end + 1
  return true
}
md.inline.ruler.before('escape', 'math_inline', mathInlineRule)

const mathBlockRule: RuleBlock = (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const lineEnd = state.eMarks[startLine]
  if (!state.src.slice(start, lineEnd).startsWith('$$')) return false
  if (silent) return true

  const firstLine = state.src.slice(start + 2, lineEnd)
  const sameLineEnd = firstLine.lastIndexOf('$$')
  let content = ''
  let nextLine = startLine
  if (sameLineEnd >= 0) {
    content = firstLine.slice(0, sameLineEnd)
  } else {
    const lines = [firstLine]
    let found = false
    while (++nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
      const current = state.src.slice(lineStart, state.eMarks[nextLine])
      const close = current.indexOf('$$')
      if (close >= 0) {
        lines.push(current.slice(0, close))
        found = true
        break
      }
      lines.push(current)
    }
    if (!found) return false
    content = lines.join('\n')
  }

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = content.trim()
  token.map = [startLine, nextLine + 1]
  state.line = nextLine + 1
  return true
}
md.block.ruler.before('fence', 'math_block', mathBlockRule)

const renderMathInline: RenderRule = (tokens, index) => katex.renderToString(tokens[index].content, {
  displayMode: false,
  throwOnError: false,
  strict: false,
})
const renderMathBlock: RenderRule = (tokens, index) => `<div class="math-block">${katex.renderToString(tokens[index].content, {
  displayMode: true,
  throwOnError: false,
  strict: false,
})}</div>`
md.renderer.rules.math_inline = renderMathInline
md.renderer.rules.math_block = renderMathBlock

const defaultImageRule = md.renderer.rules.image
const renderImage: RenderRule = (tokens, index, options, env, self) => {
  const source = tokens[index].attrGet('src')
  if (source?.startsWith('mdvibe://img/')) {
    const id = source.slice('mdvibe://img/'.length)
    const resolver = (env as { imageResolver?: (imageId: string) => string | null }).imageResolver
    const resolved = resolver?.(id)
    if (resolved) tokens[index].attrSet('src', resolved)
    else return `<span class="markdown-missing-image">Missing image: ${md.utils.escapeHtml(tokens[index].content || id)}</span>`
  }
  return defaultImageRule?.(tokens, index, options, env, self) ?? self.renderToken(tokens, index, options)
}
md.renderer.rules.image = renderImage

export function sanitizeMarkdownHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext', 'annotation', 'semantics'],
    ADD_ATTR: ['class', 'style', 'aria-hidden', 'focusable', 'role', 'xmlns', 'encoding'],
  }) as string
}

export function renderMarkdown(markdown: string, imageResolver?: (imageId: string) => string | null) {
  return sanitizeMarkdownHtml(md.render(markdown, { imageResolver }))
}

export function markdownStats(markdown: string) {
  const words = (markdown.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length
  return { words, characters: markdown.length, pages: Math.max(1, Math.ceil(words / 500)), readingMinutes: Math.max(1, Math.ceil(words / 200)) }
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

export function pageDimensions(size: PageSize, landscape: boolean) {
  const dimensions: Record<PageSize, [number, number]> = {
    A4: [210, 297],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6],
    A5: [148, 210],
  }
  const [width, height] = dimensions[size]
  return landscape ? { width: height, height: width } : { width, height }
}
