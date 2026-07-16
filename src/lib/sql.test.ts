import { describe, expect, it } from 'vitest'

import { countSqlStatements, sqlFormatOptions } from './sql'

describe('SQL formatter', () => {
  it('maps formatting controls to formatter options', () => {
    expect(sqlFormatOptions('postgresql', 'upper', '4')).toEqual({ language: 'postgresql', keywordCase: 'upper', tabWidth: 4, useTabs: false, linesBetweenQueries: 2 })
    expect(sqlFormatOptions('mysql', 'lower', 'tabs')).toMatchObject({ language: 'mysql', keywordCase: 'lower', tabWidth: 2, useTabs: true })
  })

  it('counts non-empty statements', () => {
    expect(countSqlStatements('')).toBe(0)
    expect(countSqlStatements('select 1')).toBe(1)
    expect(countSqlStatements('select 1; ; select 2;')).toBe(2)
  })
})
