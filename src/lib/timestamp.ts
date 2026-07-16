export type TimestampUnit = 'seconds' | 'milliseconds'

export function parseTimestamp(value: string, unit: TimestampUnit) {
  if (!value.trim()) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  const date = new Date(unit === 'seconds' ? numeric * 1000 : numeric)
  return Number.isFinite(date.getTime()) ? date : null
}

export function timestampInUnit(date: Date, unit: TimestampUnit) {
  return unit === 'seconds' ? Math.floor(date.getTime() / 1000) : date.getTime()
}

export function toLocalDateTimeValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function relativeTime(date: Date, now: number, locale?: string) {
  const seconds = Math.round((date.getTime() - now) / 1000)
  const absolute = Math.abs(seconds)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (absolute < 60) return formatter.format(seconds, 'second')
  if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
  if (absolute < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
  return formatter.format(Math.round(seconds / 86400), 'day')
}
