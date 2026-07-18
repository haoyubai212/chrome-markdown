import { beforeEach, describe, expect, it, vi } from 'vitest'

let onMessage
let sessionValues

beforeEach(async () => {
  vi.resetModules()
  onMessage = undefined
  sessionValues = {
    'local-md-reader-single-file-42': {
      sourceUrl: 'file:///Users/test/project/docs/plan.md',
      markdown: '# Plan',
    },
  }
  vi.stubGlobal('chrome', {
    action: { onClicked: { addListener: vi.fn() } },
    runtime: {
      id: 'local-reader-test',
      getURL: (path) => `chrome-extension://local-reader-test/${path}`,
      onMessage: { addListener: vi.fn((listener) => { onMessage = listener }) },
    },
    storage: {
      session: {
        get: vi.fn(async (key) => ({ [key]: sessionValues[key] })),
        set: vi.fn(async (values) => Object.assign(sessionValues, values)),
        remove: vi.fn(async (key) => { delete sessionValues[key] }),
      },
    },
    tabs: {
      create: vi.fn(), query: vi.fn(async () => []), update: vi.fn(),
      onRemoved: { addListener: vi.fn() },
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
      }, { tab: { id: 42 } }, resolve)).toBe(true)
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
      }, { tab: { id: 42 } }, resolve)).toBe(true)
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response).toMatchObject({ ok: false })
  })
})
