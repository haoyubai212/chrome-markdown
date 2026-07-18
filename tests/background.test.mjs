import { beforeEach, describe, expect, it, vi } from 'vitest'

let onMessage

beforeEach(async () => {
  vi.resetModules()
  onMessage = undefined
  vi.stubGlobal('chrome', {
    action: { onClicked: { addListener: vi.fn() } },
    runtime: {
      id: 'chrome-markdown-test',
      getURL: (path) => `chrome-extension://chrome-markdown-test/${path}`,
      onMessage: { addListener: vi.fn((listener) => { onMessage = listener }) },
    },
    tabs: {
      create: vi.fn(), query: vi.fn(async () => []), update: vi.fn(),
    },
    windows: { update: vi.fn() },
  })
  await import('../public/background.js?background-test')
})

describe('background local file boundary', () => {
  it('fetches a descendant directory for the captured Markdown tab', async () => {
    const fetchMock = vi.fn(async () => ({ text: async () => 'addRow("guide.md", "guide.md", 0)' }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await new Promise((resolve) => {
      expect(onMessage({
        type: 'READ_LOCAL_URL',
        payload: {
          sourceUrl: 'file:///Users/test/project/docs/plan.md',
          targetUrl: 'file:///Users/test/project/docs/guides/',
          kind: 'directory',
        },
      }, { url: 'file:///Users/test/project/docs/plan.md', tab: { id: 42 } }, resolve)).toBe(true)
    })
    expect(fetchMock).toHaveBeenCalledWith('file:///Users/test/project/docs/guides/')
    expect(response).toEqual({ ok: true, text: 'addRow("guide.md", "guide.md", 0)' })
  })

  it('rejects parent traversal and never reads outside the opened file directory', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await new Promise((resolve) => {
      expect(onMessage({
        type: 'READ_LOCAL_URL',
        payload: {
          sourceUrl: 'file:///Users/test/project/docs/plan.md',
          targetUrl: 'file:///Users/test/project/',
          kind: 'directory',
        },
      }, { url: 'file:///Users/test/project/docs/plan.md', tab: { id: 42 } }, resolve)).toBe(false)
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response).toMatchObject({ ok: false })
  })

  it('rejects a source URL that does not match the actual file page sender', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await new Promise((resolve) => {
      expect(onMessage({
        type: 'READ_LOCAL_URL',
        payload: {
          sourceUrl: 'file:///Users/test/other/note.md',
          targetUrl: 'file:///Users/test/other/',
          kind: 'directory',
        },
      }, { url: 'file:///Users/test/project/docs/plan.md', tab: { id: 42 } }, resolve)).toBe(false)
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response).toMatchObject({ ok: false })
  })
})
