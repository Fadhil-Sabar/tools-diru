import { describe, expect, it } from 'vitest'

import { markdownStats, pdfFilename, pdfOptions, prefixSelectedLines, wrapSelection } from './markdown'

describe('Markdown to PDF', () => {
  it('counts words and estimates pages', () => {
    expect(markdownStats('')).toEqual({ words: 0, characters: 0, pages: 1, readingMinutes: 1 })
    expect(markdownStats(Array(501).fill('word').join(' '))).toEqual({ words: 501, characters: 2504, pages: 2, readingMinutes: 3 })
  })

  it('wraps selections and inserts placeholders', () => {
    expect(wrapSelection('hello', 0, 5, '**', '**', 'bold')).toEqual({ value: '**hello**', selectionStart: 2, selectionEnd: 7 })
    expect(wrapSelection('', 0, 0, '`', '`', 'code').value).toBe('`code`')
  })

  it('prefixes every selected line', () => {
    expect(prefixSelectedLines('one\ntwo\nthree', 4, 7, '- ')).toBe('one\n- two\nthree')
  })

  it('normalizes filenames and paper options', () => {
    expect(pdfFilename('  My Report: 2026  ')).toBe('my-report-2026.pdf')
    expect(pdfFilename('---')).toBe('document.pdf')
    expect(pdfOptions('Report', 'letter')).toMatchObject({ margin: 13, filename: 'report.pdf', jsPDF: { format: 'letter' } })
  })
})
