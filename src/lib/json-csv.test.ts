import { describe, expect, it } from 'vitest'

import { convertData, isRecord } from './json-csv'

describe('JSON and CSV converter', () => {
  it('recognizes plain records', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
  })

  it('converts object arrays to CSV with unioned columns', () => {
    const result = convertData('[{"name":"Ada"},{"name":"Grace","active":true}]', 'json-to-csv', ',', '2', true)
    expect(result).toMatchObject({ error: '', rows: 2, columns: 2 })
    expect(result.output).toBe('name,active\nAda,\nGrace,true')
  })

  it('rejects JSON arrays containing primitives', () => {
    expect(convertData('[1,2]', 'json-to-csv', ',', '2', true).error).toBe('JSON must be an object or an array of objects.')
  })

  it('converts CSV with configurable type inference and spacing', () => {
    const typed = convertData('name;active;score\nAda;true;42', 'csv-to-json', ';', 'compact', true)
    expect(JSON.parse(typed.output)).toEqual([{ name: 'Ada', active: true, score: 42 }])
    const strings = convertData('score\n42', 'csv-to-json', ',', '4', false)
    expect(JSON.parse(strings.output)).toEqual([{ score: '42' }])
    expect(strings.output).toContain('\n        "score"')
  })
})
