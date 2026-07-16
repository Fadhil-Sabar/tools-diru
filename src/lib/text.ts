export type TextTransform = 'upper' | 'lower' | 'title' | 'sentence'

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'this', 'that', 'your', 'with', 'into', 'one', 'they'])

export function analyzeText(text: string) {
  const words = text.match(/[\p{L}\p{N}'’-]+/gu) ?? []
  const sentences = text.trim() ? text.split(/[.!?]+(?=\s|$)/).filter((item) => item.trim()).length : 0
  const frequencies = new Map<string, number>()
  for (const word of words) {
    const normalized = word.toLocaleLowerCase()
    if (normalized.length > 2 && !STOP_WORDS.has(normalized)) frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1)
  }
  return {
    words: words.length,
    characters: text.length,
    noSpaces: text.replace(/\s/g, '').length,
    lines: text ? text.split('\n').length : 0,
    sentences,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: words.length ? Math.max(1, Math.ceil(words.length / 200)) : 0,
    keywords: [...frequencies.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6),
  }
}

export function transformText(text: string, kind: TextTransform) {
  if (kind === 'upper') return text.toLocaleUpperCase()
  if (kind === 'lower') return text.toLocaleLowerCase()
  if (kind === 'title') return text.toLocaleLowerCase().replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase())
  return text.toLocaleLowerCase().replace(/(^|[.!?]\s+)\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}
