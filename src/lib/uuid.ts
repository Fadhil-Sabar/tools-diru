export type UuidFormat = 'standard' | 'uppercase' | 'compact' | 'braces'
export type UuidSeparator = 'newline' | 'comma' | 'space'

export function clampUuidCount(count: number) {
  return Math.min(100, Math.max(1, Number.isFinite(count) ? count : 1))
}

export function generateUuids(count: number, generate: () => string = () => crypto.randomUUID()) {
  return Array.from({ length: clampUuidCount(count) }, generate)
}

export function formatUuid(uuid: string, format: UuidFormat) {
  if (format === 'uppercase') return uuid.toUpperCase()
  if (format === 'compact') return uuid.replaceAll('-', '')
  if (format === 'braces') return `{${uuid}}`
  return uuid
}

export function joinUuids(uuids: string[], separator: UuidSeparator) {
  return uuids.join(separator === 'newline' ? '\n' : separator === 'comma' ? ', ' : ' ')
}
