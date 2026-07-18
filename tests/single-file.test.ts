import { describe, expect, it, vi } from 'vitest'
import { loadCapturedMarkdown, matchingStoredDirectories, relativePathFromSource, singleFileStorageKey, toLoadedDocument } from '../src/lib/singleFile'

describe('single-file handoff', () => {
  it('loads a captured file from extension session storage', async () => {
    const key = singleFileStorageKey('42')
    vi.stubGlobal('chrome', {
      storage: {
        session: {
          get: vi.fn().mockResolvedValue({
            [key]: { name: '笔记.md', parentName: '文稿', markdown: '# 标题', sourceUrl: 'file:///文稿/笔记.md' },
          }),
        },
      },
    })
    const captured = await loadCapturedMarkdown('42')
    expect(captured.name).toBe('笔记.md')
    expect(toLoadedDocument(captured)).toMatchObject({ path: '笔记.md', markdown: '# 标题' })
    vi.unstubAllGlobals()
  })

  it('derives the opened file path inside an authorized containing directory', () => {
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'brain-hub')).toBe('docs/plan.md')
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'docs')).toBe('plan.md')
    expect(relativePathFromSource('file:///Users/test/brain-hub/docs/plan.md', 'other')).toBeNull()
  })

  it('matches all remembered directories that can contain the opened file', () => {
    const handles = [{ name: 'other' }, { name: 'brain-hub' }, { name: 'docs' }] as FileSystemDirectoryHandle[]
    const matches = matchingStoredDirectories('file:///Users/test/brain-hub/docs/plan.md', handles)
    expect(matches.map(({ handle, relativePath }) => [handle.name, relativePath])).toEqual([
      ['brain-hub', 'docs/plan.md'],
      ['docs', 'plan.md'],
    ])
  })
})
