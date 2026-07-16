export type JsonMode = 'format' | 'minify'
export type JsonIndent = '2' | '4' | 'tab'

export interface JsonStats {
  keys: number
  values: number
  depth: number
}

export function inspectJson(value: unknown, level = 1): JsonStats {
  if (Array.isArray(value)) {
    return value.reduce<JsonStats>((total, item) => {
      const child = inspectJson(item, level + 1)
      return { keys: total.keys + child.keys, values: total.values + child.values, depth: Math.max(total.depth, child.depth) }
    }, { keys: 0, values: 0, depth: level })
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce<JsonStats>((total, [, item]) => {
      const child = inspectJson(item, level + 1)
      return { keys: total.keys + 1 + child.keys, values: total.values + child.values, depth: Math.max(total.depth, child.depth) }
    }, { keys: 0, values: 0, depth: level })
  }
  return { keys: 0, values: 1, depth: level }
}

export function describeJsonError(error: unknown, input: string) {
  const message = error instanceof Error ? error.message : 'Invalid JSON'
  const position = message.match(/position\s+(\d+)/i)?.[1]
  if (!position) return message
  const offset = Number(position)
  const beforeError = input.slice(0, offset)
  const line = beforeError.split('\n').length
  const column = offset - beforeError.lastIndexOf('\n')
  return `${message} · line ${line}, column ${column}`
}

export function formatJson(input: string, mode: JsonMode, indent: JsonIndent) {
  if (!input.trim()) return { output: '', error: '', stats: null }
  try {
    const parsed: unknown = JSON.parse(input)
    const spacing = mode === 'minify' ? undefined : indent === 'tab' ? '\t' : Number(indent)
    return { output: JSON.stringify(parsed, null, spacing), error: '', stats: inspectJson(parsed) }
  } catch (error) {
    return { output: '', error: describeJsonError(error, input), stats: null }
  }
}
