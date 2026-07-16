import { diffLines } from 'diff'

export function toLines(value: string) {
  const withoutFinalNewline = value.endsWith('\n') ? value.slice(0, -1) : value
  return withoutFinalNewline ? withoutFinalNewline.split('\n') : []
}

export function diffStats(before: string, after: string, ignoreWhitespace = false) {
  return diffLines(before, after, { ignoreWhitespace }).reduce((total, change) => {
    const count = toLines(change.value).length
    if (change.added) total.additions += count
    if (change.removed) total.deletions += count
    return total
  }, { additions: 0, deletions: 0 })
}
