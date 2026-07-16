const DRAFT_KEY = 'markdown-pdf-draft-v2'

export interface MarkdownDraft {
  content: string
  fileName: string
  savedAt: number
}

export function loadMarkdownDraft(): MarkdownDraft | null {
  try {
    const value = localStorage.getItem(DRAFT_KEY)
    return value ? JSON.parse(value) as MarkdownDraft : null
  } catch {
    return null
  }
}

export function saveMarkdownDraft(content: string, fileName: string) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, fileName, savedAt: Date.now() } satisfies MarkdownDraft))
  } catch {
    // Storage can be unavailable or full; editing must remain functional.
  }
}

export function clearMarkdownDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
