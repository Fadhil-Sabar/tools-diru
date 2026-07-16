import { describe, expect, it } from 'vitest'

import { describeJsonError, formatJson, inspectJson } from './json'

describe('JSON formatter', () => {
  it('inspects nested keys, values, and depth', () => {
    expect(inspectJson({ user: { name: 'Ada' }, active: true, tags: ['a', 'b'] })).toEqual({ keys: 4, values: 4, depth: 3 })
  })

  it('formats and minifies JSON', () => {
    expect(formatJson('{"a":1}', 'format', '2').output).toBe('{\n  "a": 1\n}')
    expect(formatJson('{ "a": 1 }', 'minify', '4').output).toBe('{"a":1}')
    expect(formatJson('{"a":1}', 'format', 'tab').output).toContain('\n\t"a"')
  })

  it('reports syntax locations and handles empty input', () => {
    expect(describeJsonError(new Error('Unexpected token at position 4'), '{}\n x')).toContain('line 2, column 2')
    expect(formatJson('', 'format', '2')).toEqual({ output: '', error: '', stats: null })
    expect(formatJson('{]', 'format', '2').error).not.toBe('')
  })
})
