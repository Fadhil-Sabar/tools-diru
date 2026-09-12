import { describe, expect, it } from 'vitest'
import { TOOLS } from './tools'

describe('tools catalog', () => {
  it('links Mimin WebUI to its GitHub repository', () => {
    const mimin = TOOLS.find((tool) => tool.id === 'mimin-webui')

    expect(mimin).toMatchObject({
      name: 'Mimin WebUI',
      description: 'A minimal workspace for project-based AI agents, persistent conversations, knowledge, models, and tools.',
      category: 'Developer',
      available: true,
      externalUrl: 'https://github.com/Fadhil-Sabar/mimin-webui',
    })
  })
})
