import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TopBar } from '../src/components/TopBar'

const handlers = {
  onThemeToggle: () => undefined,
  onRefresh: () => undefined,
  onSettings: () => undefined,
}

describe('TopBar file address', () => {
  it('shows a copy action for the current local document URL', () => {
    const html = renderToStaticMarkup(
      <TopBar rootName="brain-hub" path="wiki/topics/ai-music.md" sourceUrl="file:///Users/test/brain-hub/wiki/topics/ai-music.md" theme="light" language="zh" loading={false} {...handlers} />,
    )

    expect(html).toContain('brain-hub')
    expect(html).toContain('ai-music.md')
    expect(html).toContain('aria-label="复制完整文件地址"')
    expect(html).toContain('file:///Users/test/brain-hub/wiki/topics/ai-music.md')
  })

  it('does not show the copy action when the native path is unavailable', () => {
    const html = renderToStaticMarkup(
      <TopBar rootName="Local MD Reader" path="" theme="dark" language="en" loading={false} {...handlers} />,
    )

    expect(html).not.toContain('Copy full file address')
  })
})
