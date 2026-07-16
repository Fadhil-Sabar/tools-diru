import Papa from 'papaparse'

export type DataDirection = 'json-to-csv' | 'csv-to-json'
export type DataDelimiter = ',' | ';' | '\t'
export type JsonSpacing = '2' | '4' | 'compact'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function convertData(input: string, direction: DataDirection, delimiter: DataDelimiter, jsonSpacing: JsonSpacing, inferTypes: boolean) {
  if (!input.trim()) return { output: '', error: '', rows: 0, columns: 0 }
  try {
    if (direction === 'json-to-csv') {
      const parsed: unknown = JSON.parse(input)
      const rows = Array.isArray(parsed) ? parsed : [parsed]
      if (!rows.every(isRecord)) throw new Error('JSON must be an object or an array of objects.')
      const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))]
      return { output: Papa.unparse(rows, { columns: fields, delimiter, newline: '\n' }), error: '', rows: rows.length, columns: fields.length }
    }

    const parsed = Papa.parse<Record<string, unknown>>(input, {
      header: true,
      delimiter,
      skipEmptyLines: 'greedy',
      dynamicTyping: inferTypes,
    })
    const seriousError = parsed.errors.find((error) => error.type !== 'Delimiter')
    if (seriousError) throw new Error(`${seriousError.message}${seriousError.row !== undefined ? ` at row ${seriousError.row + 1}` : ''}`)
    const spacing = jsonSpacing === 'compact' ? undefined : Number(jsonSpacing)
    return { output: JSON.stringify(parsed.data, null, spacing), error: '', rows: parsed.data.length, columns: parsed.meta.fields?.length ?? 0 }
  } catch (error) {
    return { output: '', error: error instanceof Error ? error.message : 'Unable to convert this data.', rows: 0, columns: 0 }
  }
}
