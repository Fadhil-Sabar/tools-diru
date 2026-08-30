import { useMemo, useState } from 'react'
import {
  Bot,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { renderMarkdown } from '@/lib/markdown'
import {
  extractFrontmatterAndBody,
  filterSkills,
  PRESET_SKILLS,
  type SkillCategory,
  type SkillTarget,
} from '@/lib/skills'

const CATEGORIES: Array<'All' | SkillCategory> = [
  'All',
  'Docs',
  'Architecture',
  'Engineering',
]

const TARGETS: Array<'All' | SkillTarget> = [
  'All',
  'Antigravity',
  'Claude Code',
  'Cursor',
  'Windsurf',
  'Generic',
]

export default function AgentSkillsRoute() {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('prd-generator')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | SkillCategory>('All')
  const [selectedTarget, setSelectedTarget] = useState<'All' | SkillTarget>('All')
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview')
  const [copiedAction, setCopiedAction] = useState<string | null>(null)

  const filteredSkills = useMemo(() => {
    return filterSkills(PRESET_SKILLS, searchQuery, selectedCategory, selectedTarget)
  }, [searchQuery, selectedCategory, selectedTarget])

  const activeSkill = useMemo(() => {
    return PRESET_SKILLS.find((s) => s.id === selectedSkillId) ?? filteredSkills[0] ?? PRESET_SKILLS[0]
  }, [selectedSkillId, filteredSkills])

  const { frontmatter, body } = useMemo(() => {
    if (!activeSkill) return { frontmatter: '', body: '' }
    return extractFrontmatterAndBody(activeSkill.content)
  }, [activeSkill])

  const renderedHtml = useMemo(() => {
    return renderMarkdown(body)
  }, [body])

  function handleCopy(text: string, actionKey: string) {
    navigator.clipboard.writeText(text)
    setCopiedAction(actionKey)
    setTimeout(() => setCopiedAction(null), 2000)
  }

  function handleDownload() {
    if (!activeSkill) return
    const blob = new Blob([activeSkill.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeSkill.name}.SKILL.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="skills-tool">
      {/* Filter and Search Bar */}
      <div className="skills-filter-bar">
        <div className="skills-search-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search skills by name, tag, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="skills-clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X />
            </button>
          )}
        </div>

        <div className="skills-filter-group">
          <label htmlFor="target-select" className="skills-filter-label">Platform:</label>
          <select
            id="target-select"
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value as 'All' | SkillTarget)}
            className="skills-select"
          >
            {TARGETS.map((target) => (
              <option key={target} value={target}>
                {target === 'All' ? 'All Platforms' : target}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="skills-categories" role="tablist" aria-label="Skill categories">
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? PRESET_SKILLS.length : PRESET_SKILLS.filter((s) => s.category === cat).length
          return (
            <button
              key={cat}
              className={`skills-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{cat}</span>
              <span className="skills-cat-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Main Split Layout */}
      <div className="skills-layout">
        {/* Left List */}
        <aside className="skills-sidebar" aria-label="Skills list">
          <div className="skills-list-header">
            <span>{filteredSkills.length} {filteredSkills.length === 1 ? 'skill' : 'skills'} available</span>
          </div>

          <div className="skills-list">
            {filteredSkills.map((skill) => {
              const isSelected = activeSkill?.id === skill.id
              return (
                <button
                  key={skill.id}
                  className={`skills-card-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  <div className="skills-card-top">
                    <span className="skills-card-title">{skill.title}</span>
                  </div>
                  <code className="skills-card-name">{skill.name}</code>
                  <p className="skills-card-desc">{skill.description}</p>
                  <div className="skills-card-footer">
                    <span className="skills-category-badge">{skill.category}</span>
                    <div className="skills-target-icons">
                      {skill.targets.map((t) => (
                        <span key={t} className="skills-target-chip" title={`Compatible with ${t}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}

            {filteredSkills.length === 0 && (
              <div className="skills-empty">
                <Sparkles />
                <p>No skills match your search filters.</p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedTarget('All') }}>
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Stage / Detail View */}
        {activeSkill ? (
          <main className="skills-stage">
            {/* Skill Title & Actions */}
            <div className="skills-stage-header">
              <div className="skills-stage-meta">
                <div className="skills-stage-breadcrumbs">
                  <span className="skills-pill-category">{activeSkill.category}</span>
                  <span className="skills-version">v{activeSkill.version}</span>
                  {activeSkill.author && <span className="skills-author">by {activeSkill.author}</span>}
                </div>
                <h2>{activeSkill.title}</h2>
                <div className="skills-identifier">
                  <Tag />
                  <code>name: {activeSkill.name}</code>
                  <div className="skills-targets-list">
                    {activeSkill.targets.map((target) => (
                      <span key={target} className="skills-platform-tag">{target}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="skills-stage-actions">
                <Button
                  onClick={() => handleCopy(activeSkill.content, 'copy-full')}
                  size="sm"
                  title="Copy full SKILL.md file"
                >
                  {copiedAction === 'copy-full' ? <><Check /> Copied!</> : <><Copy /> Copy SKILL.md</>}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(body, 'copy-prompt')}
                  title="Copy prompt instructions only"
                >
                  {copiedAction === 'copy-prompt' ? <><Check /> Copied!</> : <><Code2 /> Copy Prompt Only</>}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  title="Download SKILL.md file"
                >
                  <Download /> Download
                </Button>
              </div>
            </div>

            {/* Stage Tabs */}
            <div className="skills-tabs">
              <button
                className={`skills-tab ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye /> Preview
              </button>
              <button
                className={`skills-tab ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                <FileCode2 /> Raw SKILL.md
              </button>
            </div>

            {/* Tab Contents */}
            <div className="skills-stage-body">
              {activeTab === 'preview' && (
                <div className="skills-preview-container">
                  {frontmatter && (
                    <div className="skills-frontmatter-box">
                      <span className="skills-frontmatter-label">YAML Frontmatter</span>
                      <pre><code>{frontmatter}</code></pre>
                    </div>
                  )}
                  <div
                    className="skills-rendered-markdown markdown-preview-body"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="skills-raw-container">
                  <div className="skills-raw-toolbar">
                    <span>SKILL.md ({activeSkill.content.split('\n').length} lines)</span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleCopy(activeSkill.content, 'raw-copy')}
                    >
                      {copiedAction === 'raw-copy' ? <><Check /> Copied</> : <><Copy /> Copy</>}
                    </Button>
                  </div>
                  <pre className="skills-raw-code">
                    <code>{activeSkill.content}</code>
                  </pre>
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className="skills-no-selection">
            <Bot />
            <h3>No Skill Selected</h3>
            <p>Choose a skill from the catalog on the left.</p>
          </div>
        )}
      </div>
    </div>
  )
}
