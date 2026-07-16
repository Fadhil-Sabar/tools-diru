import { Braces, Clock3, FileCode2, FileText, Hash } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolId = 'home' | 'diff' | 'json' | 'timestamp' | 'text' | 'uuid'

export interface Tool {
  id: Exclude<ToolId, 'home'>
  name: string
  description: string
  category: 'Developer' | 'Text'
  icon: LucideIcon
  available: boolean
  accent: string
  path: string
}

export const TOOLS: Tool[] = [
  { id: 'diff', name: 'Diff viewer', description: 'Compare text and inspect every change.', category: 'Developer', icon: FileCode2, available: true, accent: 'rust', path: '/diff-viewer' },
  { id: 'json', name: 'JSON formatter', description: 'Format, validate, and minify JSON.', category: 'Developer', icon: Braces, available: true, accent: 'pine', path: '/json-formatter' },
  { id: 'timestamp', name: 'Timestamp', description: 'Convert Unix time and local dates.', category: 'Developer', icon: Clock3, available: true, accent: 'ochre', path: '/timestamp' },
  { id: 'text', name: 'Text inspector', description: 'Count words, lines, and characters.', category: 'Text', icon: FileText, available: true, accent: 'blue', path: '/text-inspector' },
  { id: 'uuid', name: 'UUID generator', description: 'Create secure identifiers in batches.', category: 'Developer', icon: Hash, available: true, accent: 'violet', path: '/uuid-generator' },
]

export function toolByPath(path: string): Tool | undefined {
  return TOOLS.find((tool) => tool.path === path)
}

export function toolBreadcrumb(pathname: string): string {
  if (pathname === '/') return 'Overview'
  const tool = toolByPath(pathname)
  return tool ? tool.name : 'Unknown'
}
