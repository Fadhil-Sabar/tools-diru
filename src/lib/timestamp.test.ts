import { describe, expect, it } from 'vitest'

import { parseTimestamp, relativeTime, timestampInUnit, toLocalDateTimeValue } from './timestamp'

describe('timestamp converter', () => {
  it('parses seconds and milliseconds as the same instant', () => {
    expect(parseTimestamp('1', 'seconds')?.getTime()).toBe(1000)
    expect(parseTimestamp('1000', 'milliseconds')?.getTime()).toBe(1000)
    expect(parseTimestamp('nope', 'seconds')).toBeNull()
  })

  it('converts dates to timestamp units', () => {
    const date = new Date(1999)
    expect(timestampInUnit(date, 'seconds')).toBe(1)
    expect(timestampInUnit(date, 'milliseconds')).toBe(1999)
  })

  it('formats local inputs and relative ranges', () => {
    const local = new Date(2025, 0, 2, 3, 4, 5)
    expect(toLocalDateTimeValue(local)).toBe('2025-01-02T03:04:05')
    expect(relativeTime(new Date(120_000), 0, 'en')).toBe('in 2 minutes')
    expect(relativeTime(new Date(-86_400_000), 0, 'en')).toBe('yesterday')
  })
})
