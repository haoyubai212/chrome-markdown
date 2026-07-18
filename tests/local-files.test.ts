import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAllowedLocalTarget, localUrlForPath, parentDirectoryUrl, parseChromeDirectoryIndex, readLocalDirectory, replaceDirectoryChildren } from '../src/lib/localFiles'
import type { TreeNode } from '../src/types'

const directoryHtml = `
  <script>
    addRow("Parent Directory", "../", 1, 0, "", 0, "");
    addRow("guides", "guides/", 1, 0, "", 1700000000, "");
    addRow("node_modules", "node_modules/", 1, 0, "", 1700000000, "");
    addRow(".private.md", ".private.md", 0, 12, "12 B", 1700000000, "");
    addRow("plan.md", "plan.md", 0, 42, "42 B", 1700000000, "");
    addRow("notes.txt", "notes.txt", 0, 18, "18 B", 1700000000, "");
  </script>
`

afterEach(() => vi.unstubAllGlobals())

describe('local file URL directory bridge', () => {
  it('derives the immediate parent directory of an opened Markdown file', () => {
    expect(parentDirectoryUrl('file:///Users/test/project/docs/plan.md')).toBe('file:///Users/test/project/docs/')
    expect(localUrlForPath('file:///Users/test/project/docs/', 'guides/getting started.md'))
      .toBe('file:///Users/test/project/docs/guides/getting%20started.md')
  })

  it('allows only the opened file parent directory, descendants, and Markdown files', () => {
    const source = 'file:///Users/test/project/docs/plan.md'
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/docs/', 'directory')).toBe(true)
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/docs/guides/', 'directory')).toBe(true)
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/docs/guides/intro.md', 'markdown')).toBe(true)
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/docs/images/cover.png', 'asset')).toBe(true)
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/', 'directory')).toBe(false)
    expect(isAllowedLocalTarget(source, 'file:///Users/test/project/docs/secret.txt', 'markdown')).toBe(false)
    expect(isAllowedLocalTarget(source, 'https://example.com/plan.md', 'markdown')).toBe(false)
  })

  it('parses Chrome addRow directory entries and filters unsafe or irrelevant rows', () => {
    const tree = parseChromeDirectoryIndex(directoryHtml, 'file:///Users/test/project/docs/')
    expect(tree.map(({ kind, name, path }) => [kind, name, path])).toEqual([
      ['directory', 'guides', 'guides'],
      ['file', 'plan.md', 'plan.md'],
    ])
    expect(tree[0]).toMatchObject({ url: 'file:///Users/test/project/docs/guides/', loaded: false })
  })

  it('requests a directory through the extension background bridge', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, text: directoryHtml })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })
    const tree = await readLocalDirectory(
      'file:///Users/test/project/docs/plan.md',
      'file:///Users/test/project/docs/',
    )
    expect(tree.map((node) => node.name)).toEqual(['guides', 'plan.md'])
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'READ_LOCAL_URL',
      payload: {
        sourceUrl: 'file:///Users/test/project/docs/plan.md',
        targetUrl: 'file:///Users/test/project/docs/',
        kind: 'directory',
      },
    })
  })

  it('fills a lazy directory without rebuilding untouched branches', () => {
    const tree: TreeNode[] = [
      { kind: 'directory', name: 'guides', path: 'guides', url: 'file:///docs/guides/', loaded: false, children: [] },
      { kind: 'file', name: 'plan.md', path: 'plan.md', url: 'file:///docs/plan.md' },
    ]
    const children: TreeNode[] = [{ kind: 'file', name: 'intro.md', path: 'guides/intro.md', url: 'file:///docs/guides/intro.md' }]
    const next = replaceDirectoryChildren(tree, 'guides', children)
    expect(next[0]).toMatchObject({ loaded: true, children })
    expect(next[1]).toBe(tree[1])
    expect(replaceDirectoryChildren(tree, 'missing', children)).toBe(tree)
  })
})
