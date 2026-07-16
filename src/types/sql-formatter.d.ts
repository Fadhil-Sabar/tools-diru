declare module 'sql-formatter' {
  export interface FormatOptions {
    language?: string
    tabWidth?: number
    useTabs?: boolean
    keywordCase?: 'preserve' | 'upper' | 'lower'
    linesBetweenQueries?: number
  }

  export function format(query: string, options?: FormatOptions): string
}
