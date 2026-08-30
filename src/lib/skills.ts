export type SkillCategory = 'Docs' | 'Architecture' | 'Engineering'
export type SkillTarget = 'Antigravity' | 'Claude Code' | 'Cursor' | 'Windsurf' | 'Generic'

export interface SkillItem {
  id: string
  name: string
  title: string
  description: string
  category: SkillCategory
  author?: string
  version: string
  tags: string[]
  targets: SkillTarget[]
  content: string
}

export const PRESET_SKILLS: SkillItem[] = [
  {
    id: 'prd-generator',
    name: 'prd-generator',
    title: 'PRD Generator (prdly Standard)',
    description: 'Generate complete, actionable, developer-ready Product Requirement Documents (PRDs) with Mermaid architecture diagrams, ERDs, API contracts, tech stack tables, and file checklists matching prdly standards.',
    category: 'Docs',
    author: 'prdly',
    version: '1.0.0',
    tags: ['PRD', 'Specification', 'Architecture', 'Mermaid', 'ERD', 'API'],
    targets: ['Antigravity', 'Claude Code', 'Cursor', 'Windsurf', 'Generic'],
    content: `---
name: prd-generator
description: Generate complete, actionable, developer-ready Product Requirement Documents (PRDs) with Mermaid architecture diagrams, ERDs, API contracts, tech stack tables, and file checklists matching prdly standards.
---

# PRD Generator Skill

This skill is used to generate **Product Requirement Documents (PRDs)** or project specifications that are technical, structured, concise, and immediately ready for use by developers and AI coding agents (such as Claude Code, Cursor, etc.). This specification strictly follows the standards of the **prdly** project.

---

## 1. Mandatory Output Format

The PRD document must be written in valid Markdown and follow the structure below **exactly**, without adding extraneous sections:

\`\`\`markdown
# [Project Name]

## Tech Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | [e.g., TypeScript / Python 3.11+] | [Technical rationale] |
| Framework | [e.g., Next.js 14 / FastAPI / SvelteKit] | [Technical rationale] |
| Database | [e.g., PostgreSQL + Redis] | [Technical rationale] |
| Auth | [e.g., JWT / Supabase / Clerk] | [Technical rationale] |
| Deployment | [e.g., Docker / Vercel / Railway] | [Technical rationale] |

## Project Structure
\`\`\`
Project Root/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── schemas/
│   ├── config/
│   └── main.ts
├── tests/
├── migrations/
├── Dockerfile
└── README.md
\`\`\`
*(Realistic folder structure tailored to the chosen tech stack)*

## Core Features
- [ ] Feature 1: One-line description
- [ ] Feature 2: One-line description
...

## Visual & UX Design
- **Theme**: [e.g., Sleek Modern Dark Mode, Earth Tone Minimalist, Cyberpunk Neon]
- **Layout**: [e.g., Single-page application, Multi-column dashboard, Mobile-first]
- **Key UI Elements**: [e.g., Glassmorphic cards, charts, dense data tables, responsive navigation]
- **Micro-interactions**: [e.g., Smooth transitions, hover scaling, skeleton loaders, button press effects]

## System Architecture
\`\`\`mermaid
flowchart TB
    subgraph Client
        Web[Web App]
    end
    subgraph Backend
        API[API Gateway]
        Auth[Auth Service]
        Main[Main Service]
    end
    subgraph Data
        DB[(Database)]
        Cache[(Cache)]
    end
    Web --> API
    API --> Auth
    API --> Main
    Main --> DB
    Main --> Cache
\`\`\`
*(Relevant system architecture diagram using Mermaid.js syntax — flowchart TB or C4 style)*

## Data Model
\`\`\`mermaid
erDiagram
    User ||--o{ Order : places
    Order ||--|{ OrderItem : contains
    Product ||--o{ OrderItem : "ordered in"
    User {
        uuid id PK
        string email UK
        string password_hash
        timestamp created_at
    }
\`\`\`
*(Complete ER diagram using Mermaid.js syntax with proper cardinality, attributes, data types, and PK/FK/UK constraints)*

## API Contracts
| Method | Endpoint | Request Body | Response | Auth |
|--------|----------|-------------|----------|------|
| POST | /api/auth/login | {email, password} | {token, user} | No |
| GET | /api/users/me | - | {user} | Yes |
| POST | /api/tasks | {title, description} | {task} | Yes |

*(Include ALL key endpoints required for the core features)*

## Key Business Rules
- [Rule 1]: Specific logic description
- [Rule 2]: State transitions, validation rules
- [Rule 3]: Authorization / permission rules

## Constraints & Edge Cases
- Rate limit: [N] req/min per user
- Input validation: [specific validation rules]
- Pagination: [N] items/page
- Error handling: [specific error handling approach]

## File Generation Checklist
- [ ] Project scaffolding & dependencies
- [ ] Database migrations / schema
- [ ] Models, entities, or ORM definitions
- [ ] API routes & controllers
- [ ] Auth middleware
- [ ] Business logic services
- [ ] Unit tests (min 80% coverage)
- [ ] Docker setup
- [ ] Environment config (.env.example)
- [ ] README with setup instructions
\`\`\`

---

## 2. Generation Rules & Principles (Prdly Standard)

1. **Mandatory Mermaid Diagrams**:
   - Always include at least 2 valid Mermaid diagrams: **System Architecture** (\`flowchart\`) and **Data Model** (\`erDiagram\`).
   - Quote node labels that contain special characters or parentheses.
2. **Specific & Technical**:
   - Provide precise folder paths, exact API shapes, and explicit database column types.
3. **Developer-Focused (No Marketing Filler)**:
   - **DO NOT** include sections like: *Executive Summary*, *Problem Statement*, *Timeline*, *Success Metrics*, or *Risks*.
   - Keep the tone technical, direct, and developer-ready.
4. **No Emojis**:
   - Do not include emojis in the PRD output text.
5. **Two Operating Modes**:
   - **Create Mode**: Generate a complete new specification from a brief user prompt or tech stack selection.
   - **Modify / Iterate Mode**: When requested to modify (e.g., "add task categories", "switch to cyberpunk theme"), update the spec completely and return the **FULL updated document**, not just a diff.

---

## 3. How to Use This Skill

When asked to generate a project spec / PRD:
1. Identify or request:
   - Project name & core idea.
   - Desired tech stack (language, framework, database, auth, deployment).
   - Visual / UX design preferences (optional).
2. Apply the strict Markdown structure above.
3. Validate Mermaid syntax to ensure diagrams render correctly.
`,
  },
]

export function filterSkills(
  allSkills: SkillItem[],
  query: string,
  category: string,
  target: string,
): SkillItem[] {
  const q = query.trim().toLowerCase()
  return allSkills.filter((skill) => {
    if (category !== 'All' && skill.category !== category) return false
    if (target !== 'All' && !skill.targets.includes(target as SkillTarget)) return false
    if (!q) return true

    const matchText = `${skill.name} ${skill.title} ${skill.description} ${skill.tags.join(' ')} ${skill.category}`.toLowerCase()
    return matchText.includes(q)
  })
}

export function extractFrontmatterAndBody(fullContent: string): { frontmatter: string; body: string } {
  const match = fullContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (match) {
    return { frontmatter: match[1].trim(), body: match[2].trim() }
  }
  return { frontmatter: '', body: fullContent.trim() }
}
