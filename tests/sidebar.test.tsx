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
        singleFileMode
        showFolderAction
        restoreFolderName="brain-hub"
        onTabChange={() => undefined}
        onQueryChange={() => undefined}
        onOpen={() => undefined}
        onExpandDirectory={async () => undefined}
        onChooseFolder={() => undefined}
        onRestoreFolder={() => undefined}
      />,
    )
    expect(html).toContain('恢复“brain-hub”')
    expect(html).toContain('plan.md')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('搜索文件')
  })
})
