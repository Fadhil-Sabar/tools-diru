export type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'transactsql' | 'bigquery' | 'snowflake' | 'plsql'
export type KeywordCase = 'preserve' | 'upper' | 'lower'
export type SqlIndentation = '2' | '4' | 'tabs'

export function sqlFormatOptions(dialect: SqlDialect, keywordCase: KeywordCase, indentation: SqlIndentation) {
  return {
    language: dialect,
    keywordCase,
    tabWidth: indentation === '4' ? 4 : 2,
    useTabs: indentation === 'tabs',
    linesBetweenQueries: 2,
  }
}

export function countSqlStatements(input: string) {
  return input.trim() ? Math.max(1, input.split(';').filter((statement) => statement.trim()).length) : 0
}
