import { Bot, Braces, Clock3, Database, Eraser, FileCode2, FileDown, FileText, Gauge, Hash, Image, Languages, Palette, QrCode, SwatchBook, Table2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolId = 'home' | 'diff' | 'json' | 'timestamp' | 'text' | 'uuid' | 'markdown' | 'sql' | 'csv' | 'color' | 'image-color' | 'background-remover' | 'palette' | 'japanese-quiz' | 'token-visualizer' | 'qr-code' | 'agent-skills'

export interface Tool {
  id: Exclude<ToolId, 'home'>
  name: string
  description: string
  category: 'Developer' | 'Text' | 'Data' | 'Design'
  icon: LucideIcon
  available: boolean
  accent: string
  path: string
}

export const TOOLS: Tool[] = [
  { id: 'diff', name: 'Diff viewer', description: 'Compare text and inspect every change.', category: 'Developer', icon: FileCode2, available: true, accent: 'rust', path: '/diff-viewer' },
  { id: 'agent-skills', name: 'Agent skills', description: 'Browse, customize, and copy curated SKILL.md templates for AI agents.', category: 'Developer', icon: Bot, available: true, accent: 'pine', path: '/agent-skills' },
  { id: 'json', name: 'JSON formatter', description: 'Format, validate, and minify JSON.', category: 'Developer', icon: Braces, available: true, accent: 'pine', path: '/json-formatter' },
  { id: 'timestamp', name: 'Timestamp', description: 'Convert Unix time and local dates.', category: 'Developer', icon: Clock3, available: true, accent: 'ochre', path: '/timestamp' },
  { id: 'token-visualizer', name: 'Token speed', description: 'Visualize streaming text at any token rate.', category: 'Developer', icon: Gauge, available: true, accent: 'rust', path: '/token-visualizer' },
  { id: 'text', name: 'Text inspector', description: 'Count words, lines, and characters.', category: 'Text', icon: FileText, available: true, accent: 'blue', path: '/text-inspector' },
  { id: 'japanese-quiz', name: 'Japanese Vocabulary', description: 'Practice Japanese job vocabulary with quick quizzes.', category: 'Text', icon: Languages, available: true, accent: 'rust', path: '/japanese-quiz' },
  { id: 'uuid', name: 'UUID generator', description: 'Create secure identifiers in batches.', category: 'Developer', icon: Hash, available: true, accent: 'violet', path: '/uuid-generator' },
  { id: 'markdown', name: 'Markdown to PDF', description: 'Write, preview, and export polished PDFs.', category: 'Text', icon: FileDown, available: true, accent: 'ochre', path: '/markdown-pdf' },
  { id: 'sql', name: 'SQL formatter', description: 'Format queries for your database dialect.', category: 'Developer', icon: Database, available: true, accent: 'blue', path: '/sql-formatter' },
  { id: 'csv', name: 'JSON ↔ CSV', description: 'Convert structured data in either direction.', category: 'Data', icon: Table2, available: true, accent: 'pine', path: '/json-csv' },
  { id: 'qr-code', name: 'QR code converter', description: 'Convert text, links, and credentials to QR codes.', category: 'Data', icon: QrCode, available: true, accent: 'pine', path: '/qr-code' },
  { id: 'color', name: 'Color converter', description: 'Convert HEX, RGB, HSL, and CMYK colors.', category: 'Design', icon: Palette, available: true, accent: 'rust', path: '/color-converter' },
  { id: 'image-color', name: 'Image color picker', description: 'Sample pixels and palettes from images.', category: 'Design', icon: Image, available: true, accent: 'violet', path: '/image-color-picker' },
  { id: 'background-remover', name: 'Background remover', description: 'Create transparent cutouts locally with AI.', category: 'Design', icon: Eraser, available: true, accent: 'pine', path: '/background-remover' },
  { id: 'palette', name: 'Color palette', description: 'Generate random harmonious palettes.', category: 'Design', icon: SwatchBook, available: true, accent: 'violet', path: '/color-palette' },
]

export function toolByPath(path: string): Tool | undefined {
  return TOOLS.find((tool) => tool.path === path)
}

export function toolBreadcrumb(pathname: string): string {
  if (pathname === '/') return 'Overview'
  const tool = toolByPath(pathname)
  return tool ? tool.name : 'Unknown'
}
