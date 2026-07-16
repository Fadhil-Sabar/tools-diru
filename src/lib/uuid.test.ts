import { describe, expect, it, vi } from 'vitest'

import { clampUuidCount, formatUuid, generateUuids, joinUuids } from './uuid'

describe('UUID generator', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000'

  it('clamps batch sizes and calls the generator for every UUID', () => {
    const generate = vi.fn(() => uuid)
    expect(generateUuids(3, generate)).toEqual([uuid, uuid, uuid])
    expect(generate).toHaveBeenCalledTimes(3)
    expect(clampUuidCount(0)).toBe(1)
    expect(clampUuidCount(101)).toBe(100)
    expect(clampUuidCount(Number.NaN)).toBe(1)
  })

  it('supports every output format', () => {
    expect(formatUuid(uuid, 'standard')).toBe(uuid)
    expect(formatUuid(uuid, 'uppercase')).toBe(uuid.toUpperCase())
    expect(formatUuid(uuid, 'compact')).toBe('123e4567e89b12d3a456426614174000')
    expect(formatUuid(uuid, 'braces')).toBe(`{${uuid}}`)
  })

  it('joins batches with the selected separator', () => {
    expect(joinUuids(['a', 'b'], 'newline')).toBe('a\nb')
    expect(joinUuids(['a', 'b'], 'comma')).toBe('a, b')
    expect(joinUuids(['a', 'b'], 'space')).toBe('a b')
  })
})
