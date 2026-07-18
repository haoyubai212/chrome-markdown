import { describe, expect, it, vi } from 'vitest'
import { renderMarkdown } from '../src/lib/markdown'

describe('Markdown renderer', () => {
  it('sanitizes active HTML and assigns stable heading ids', async () => {
    const result = await renderMarkdown(`# 安全标题\n\n<script>alert('x')</script><img src="x" onerror="alert(1)">\n\n## 安全标题`)
    expect(result.html).not.toContain('<script')
    expect(result.html).not.toContain('onerror')
    expect(result.headings).toEqual([
      { id: '安全标题', level: 1, text: '安全标题' },
      { id: '安全标题-1', level: 2, text: '安全标题' },
    ])
  })

  it('keeps GFM, code language classes, and removes javascript URLs', async () => {
    const result = await renderMarkdown(`[bad](javascript:alert(1))\n\n\`\`\`ts\nconst value = 1\n\`\`\``)
    expect(result.html).not.toContain('javascript:')
    expect(result.html).toContain('language-ts')
    expect(result.html).toContain('hljs')
  })

  it('renders Unicode text in math without reporting KaTeX compatibility warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const result = await renderMarkdown('$x（中文）$')
    expect(result.html).toContain('katex')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('renders YAML frontmatter as properties without adding it to the outline', async () => {
    const result = await renderMarkdown(`---
title: Claude Corps Fellow 申请
type: project
status: 活跃
tags: [求职, Claude-Corps, AI]
updated: 2026-07-18
---

# Claude Corps Fellow 申请`)
    expect(result.html).toContain('frontmatter-card')
    expect(result.html).toContain('frontmatter-chip')
    expect(result.html).toContain('Claude-Corps')
    expect(result.headings).toEqual([{ id: 'claude-corps-fellow-申请', level: 1, text: 'Claude Corps Fellow 申请' }])
  })

  it('escapes HTML embedded in frontmatter values', async () => {
    const result = await renderMarkdown(`---\ntitle: <img src=x onerror=alert(1)>\n---\n\n# Safe`)
    const document = new DOMParser().parseFromString(result.html, 'text/html')
    expect(document.querySelector('.frontmatter-card img')).toBeNull()
    expect(result.html).toContain('&lt;img')
  })
})
