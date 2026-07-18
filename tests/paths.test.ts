import { describe, expect, it } from 'vitest'
import { dirname, extensionOf, flattenFiles, isMarkdownFile, normalizePath, resolveRelativePath, shouldIncludeName } from '../src/lib/paths'
import type { TreeNode } from '../src/types'

describe('path helpers', () => {
  it('normalizes traversal without leaving the authorized root', () => {
    expect(normalizePath('wiki/projects/../MEMORY.md')).toBe('wiki/MEMORY.md')
    expect(normalizePath('../../AGENT.md')).toBe('AGENT.md')
    expect(resolveRelativePath('wiki/projects/brain-hub.md', '../MEMORY.md#top')).toBe('wiki/MEMORY.md')
    expect(resolveRelativePath('wiki/MEMORY.md', '/AGENT.md')).toBe('AGENT.md')
  })

  it('recognizes Markdown extensions case-insensitively', () => {
    expect(extensionOf('README.MD')).toBe('md')
    expect(isMarkdownFile('README.MD')).toBe(true)
    expect(isMarkdownFile('notes.mdx')).toBe(true)
    expect(isMarkdownFile('database.sqlite')).toBe(false)
  })

  it('filters expensive and hidden directories by default', () => {
    expect(shouldIncludeName('.git', false)).toBe(false)
    expect(shouldIncludeName('node_modules', true)).toBe(false)
    expect(shouldIncludeName('.obsidian', true)).toBe(true)
    expect(shouldIncludeName('wiki', false)).toBe(true)
  })

  it('flattens nested trees', () => {
    const tree: TreeNode[] = [{ kind: 'directory', name: 'wiki', path: 'wiki', children: [{ kind: 'file', name: 'MEMORY.md', path: 'wiki/MEMORY.md' }] }]
    expect(flattenFiles(tree).map((file) => file.path)).toEqual(['wiki/MEMORY.md'])
    expect(dirname('wiki/MEMORY.md')).toBe('wiki')
  })
})
