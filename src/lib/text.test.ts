import { describe, expect, it } from 'vitest'

import { analyzeText, transformText } from './text'

describe('text inspector', () => {
  it('counts Unicode text, lines, sentences, and bytes', () => {
    const result = analyzeText('Hello dunia!\nCafé café.')
    expect(result).toMatchObject({ words: 4, lines: 2, sentences: 2, characters: 23, noSpaces: 20 })
    expect(result.bytes).toBeGreaterThan(result.characters)
    expect(result.keywords[0]).toEqual(['café', 2])
  })

  it('calculates reading time in 200-word increments', () => {
    expect(analyzeText('').readingMinutes).toBe(0)
    expect(analyzeText(Array(200).fill('word').join(' ')).readingMinutes).toBe(1)
    expect(analyzeText(Array(201).fill('word').join(' ')).readingMinutes).toBe(2)
  })

  it('transforms each supported case', () => {
    expect(transformText('Hello WORLD', 'lower')).toBe('hello world')
    expect(transformText('Hello world', 'upper')).toBe('HELLO WORLD')
    expect(transformText('hello WORLD', 'title')).toBe('Hello World')
    expect(transformText('HELLO. WORLD!', 'sentence')).toBe('Hello. World!')
  })
})
