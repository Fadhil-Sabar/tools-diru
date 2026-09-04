import { describe, expect, it } from 'vitest'
import {
  extractFrontmatterAndBody,
  filterSkills,
  PRESET_SKILLS,
} from './skills'

describe('skills library', () => {
  it('contains prd-generator skill matching prdly standards', () => {
    const prdSkill = PRESET_SKILLS.find((s) => s.id === 'prd-generator')
    expect(prdSkill).toBeDefined()
    expect(prdSkill?.name).toBe('prd-generator')
    expect(prdSkill?.content).toContain('name: prd-generator')
    expect(prdSkill?.content).toContain('flowchart TB')
    expect(prdSkill?.content).toContain('erDiagram')
  })

  it('extracts frontmatter and markdown body correctly', () => {
    const raw = `---
name: prd-generator
description: Generate complete, actionable PRDs
---

# PRD Generator Skill
Body content goes here.`

    const { frontmatter, body } = extractFrontmatterAndBody(raw)
    expect(frontmatter).toContain('name: prd-generator')
    expect(frontmatter).toContain('description: Generate complete, actionable PRDs')
    expect(body).toContain('# PRD Generator Skill')
    expect(body).toContain('Body content goes here.')
  })

  it('handles content without frontmatter gracefully', () => {
    const raw = '# Just Markdown Body'
    const { frontmatter, body } = extractFrontmatterAndBody(raw)
    expect(frontmatter).toBe('')
    expect(body).toBe('# Just Markdown Body')
  })

  it('filters skills by search query, category, and target', () => {
    const filteredByCategory = filterSkills(PRESET_SKILLS, '', 'Docs', 'All')
    expect(filteredByCategory.length).toBe(1)
    expect(filteredByCategory[0].id).toBe('prd-generator')

    const filteredByTarget = filterSkills(PRESET_SKILLS, '', 'All', 'Cursor')
    expect(filteredByTarget.length).toBe(2)
    expect(filteredByTarget.some((skill) => skill.id === 'prd-generator')).toBe(true)

    const filteredByQuery = filterSkills(PRESET_SKILLS, 'Mermaid', 'All', 'All')
    expect(filteredByQuery.length).toBe(1)
    expect(filteredByQuery[0].id).toBe('prd-generator')
  })
})
