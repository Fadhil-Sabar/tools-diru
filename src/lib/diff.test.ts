import { describe, expect, it } from 'vitest'

import { diffStats, toLines } from './diff'

describe('diff viewer', () => {
  it('splits text without creating a line for the final newline', () => {
    expect(toLines('one\ntwo\n')).toEqual(['one', 'two'])
    expect(toLines('')).toEqual([])
  })

  it('counts added and deleted lines', () => {
    expect(diffStats('one\ntwo', 'one\nthree\nfour')).toEqual({ additions: 2, deletions: 1 })
    expect(diffStats('same', 'same')).toEqual({ additions: 0, deletions: 0 })
  })

  it('can ignore whitespace-only changes', () => {
    expect(diffStats('const value = 1 ', 'const value = 1', true)).toEqual({ additions: 0, deletions: 0 })
  })
})
