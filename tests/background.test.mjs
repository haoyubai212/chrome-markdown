import { beforeEach, describe, expect, it, vi } from 'vitest'

let onMessage
let sessionStore

beforeEach(async () => {
  vi.resetModules()
  onMessage = undefined
  sessionStore = {}
  vi.stubGlobal('chrome', {
    action: { onClicked: { addListener: vi.fn() } },
    runtime: {
      id: 'local-reader-test',
      getURL: (path) => `chrome-extension://local-reader-test/${path}`,
      onMessage: { addListener: vi.fn((listener) => { onMessage = listener }) },
    },
    storage: {
      session: {
        get: vi.fn(async (key) => ({ [key]: sessionStore[key] })),
        set: vi.fn(async (values) => { Object.assign(sessionStore, values) }),
        remove: vi.fn(async (key) => { delete sessionStore[key] }),
      },
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

  it('preserves a root directory and expanded paths for a real navigation in the same tab', async () => {
    const saved = await new Promise((resolve) => {
      expect(onMessage({
        type: 'SAVE_LOCAL_NAVIGATION_STATE',
        payload: {
          rootUrl: 'file:///Users/test/project/',
          targetUrl: 'file:///Users/test/project/docs/plan.md',
          expandedPaths: ['docs', 'docs/guides'],
        },
      }, { url: 'file:///Users/test/project/README.md', tab: { id: 42, url: 'file:///Users/test/project/README.md' } }, resolve)).toBe(true)
    })
    expect(saved).toEqual({ ok: true })

    const loaded = await new Promise((resolve) => {
      expect(onMessage({ type: 'LOAD_LOCAL_NAVIGATION_STATE' }, {
        url: 'file:///Users/test/project/docs/plan.md',
        tab: { id: 42, url: 'file:///Users/test/project/docs/plan.md' },
      }, resolve)).toBe(true)
    })
    expect(loaded).toEqual({
      ok: true,
      state: {
        rootUrl: 'file:///Users/test/project/',
        targetUrl: 'file:///Users/test/project/docs/plan.md',
        expandedPaths: ['docs', 'docs/guides'],
      },
    })
  })

  it('allows the restored page to read its saved ancestor root but not a wider directory', async () => {
    sessionStore['local-navigation:42'] = {
      rootUrl: 'file:///Users/test/project/',
      targetUrl: 'file:///Users/test/project/docs/plan.md',
      expandedPaths: ['docs'],
    }
    const fetchMock = vi.fn(async () => ({ text: async () => 'addRow("docs", "docs/", 1)' }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await new Promise((resolve) => {
      expect(onMessage({
        type: 'READ_LOCAL_URL',
        payload: {
          sourceUrl: 'file:///Users/test/project/docs/plan.md',
          targetUrl: 'file:///Users/test/project/',
          rootUrl: 'file:///Users/test/project/',
          kind: 'directory',
        },
      }, { url: 'file:///Users/test/project/docs/plan.md', tab: { id: 42 } }, resolve)).toBe(true)
    })
    expect(response).toEqual({ ok: true, text: 'addRow("docs", "docs/", 1)' })
    expect(fetchMock).toHaveBeenCalledWith('file:///Users/test/project/')

    const rejected = await new Promise((resolve) => {
      expect(onMessage({
        type: 'READ_LOCAL_URL',
        payload: {
          sourceUrl: 'file:///Users/test/project/docs/plan.md',
          targetUrl: 'file:///Users/test/',
          rootUrl: 'file:///Users/test/project/',
          kind: 'directory',
        },
      }, { url: 'file:///Users/test/project/docs/plan.md', tab: { id: 42 } }, resolve)).toBe(true)
    })
    expect(rejected).toMatchObject({ ok: false })
  })

  it('keeps the same root when browser history returns to another file inside it', async () => {
    sessionStore['local-navigation:42'] = {
      rootUrl: 'file:///Users/test/project/',
      targetUrl: 'file:///Users/test/project/docs/plan.md',
      expandedPaths: ['docs'],
    }
    const loaded = await new Promise((resolve) => {
      expect(onMessage({ type: 'LOAD_LOCAL_NAVIGATION_STATE' }, {
        url: 'file:///Users/test/project/README.md',
        tab: { id: 42, url: 'file:///Users/test/project/README.md' },
      }, resolve)).toBe(true)
    })
    expect(loaded).toMatchObject({
      ok: true,
      state: { rootUrl: 'file:///Users/test/project/', expandedPaths: ['docs'] },
    })
  })
})
