import { describe, expect, it } from 'vitest'
import { relativePathFromSource, toLoadedDocument } from '../src/lib/singleFile'

describe('single-file handoff', () => {
  it('converts captured page content into a loaded document without session storage', () => {
    expect(toLoadedDocument({ name: '笔记.md', parentName: '文稿', markdown: '# 标题', sourceUrl: 'file:///文稿/笔记.md' }))
      .toMatchObject({ path: '笔记.md', markdown: '# 标题', sourceUrl: 'file:///文稿/笔记.md' })
  })

  it('derives the opened file path inside an authorized containing directory', () => {
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'brain-hub')).toBe('docs/plan.md')
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'docs')).toBe('plan.md')
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'other')).toBeNull()
  })
})
