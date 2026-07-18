import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Sidebar } from '../src/components/Sidebar'

describe('Sidebar folder authorization', () => {
  it('offers to restore a remembered folder without replacing the current file', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        rootName="docs"
        tree={[{ kind: 'file', name: 'plan.md', path: 'plan.md' }]}
        activePath="plan.md"
        headings={[]}
        tab="files"
        query=""
        language="zh"
        expandedPaths={new Set()}
        singleFileMode
        showFolderAction
        restoreFolderName="brain-hub"
        onTabChange={() => undefined}
        onQueryChange={() => undefined}
        onOpen={() => undefined}
        onExpandDirectory={async () => undefined}
        onDirectoryExpandedChange={() => undefined}
        onChooseFolder={() => undefined}
        onRestoreFolder={() => undefined}
      />,
    )
    expect(html).toContain('恢复“brain-hub”')
    expect(html).toContain('plan.md')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('搜索文件')
  })

  it('starts unloaded folders collapsed so the first click can load them', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        rootName="brain-hub"
        tree={[{ kind: 'directory', name: 'wiki', path: 'wiki', url: 'file:///brain-hub/wiki/', loaded: false, children: [] }]}
        activePath="AGENT.md"
        headings={[]}
        tab="files"
        query=""
        language="zh"
        expandedPaths={new Set()}
        singleFileMode={false}
        showFolderAction={false}
        onTabChange={() => undefined}
        onQueryChange={() => undefined}
        onOpen={() => undefined}
        onExpandDirectory={async () => undefined}
        onDirectoryExpandedChange={() => undefined}
        onChooseFolder={() => undefined}
        onRestoreFolder={() => undefined}
      />,
    )
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('wiki')
  })

  it('restores expanded folders after a real file navigation', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        rootName="brain-hub"
        tree={[{ kind: 'directory', name: 'wiki', path: 'wiki', url: 'file:///brain-hub/wiki/', loaded: true, children: [{ kind: 'file', name: 'MEMORY.md', path: 'wiki/MEMORY.md' }] }]}
        activePath="wiki/MEMORY.md"
        headings={[]}
        tab="files"
        query=""
        language="zh"
        expandedPaths={new Set(['wiki'])}
        singleFileMode={false}
        showFolderAction={false}
        onTabChange={() => undefined}
        onQueryChange={() => undefined}
        onOpen={() => undefined}
        onExpandDirectory={async () => undefined}
        onDirectoryExpandedChange={() => undefined}
        onChooseFolder={() => undefined}
        onRestoreFolder={() => undefined}
      />,
    )
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('MEMORY.md')
  })
})
