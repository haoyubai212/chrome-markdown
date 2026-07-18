import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const fileHandlerSource = readFileSync(resolve('public/file-handler.js'), 'utf8')
const backgroundSource = readFileSync(resolve('public/background.js'), 'utf8')

describe('local file extension handoff', () => {
  it('captures Markdown text but ignores other local files', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const run = new Function('location', 'document', 'chrome', 'URL', fileHandlerSource)
    const makeDocument = () => ({
      documentElement: { dataset: {} as Record<string, string> },
      querySelector: () => ({ textContent: '# 本地笔记' }),
      body: { innerText: '# 本地笔记' },
    })

    run({ href: 'file:///Users/test/Documents/%E7%AC%94%E8%AE%B0.md' }, makeDocument(), { runtime: { sendMessage } }, URL)
    await Promise.resolve()
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'OPEN_LOCAL_MARKDOWN',
      payload: expect.objectContaining({ name: '笔记.md', parentName: 'Documents', markdown: '# 本地笔记' }),
    }))

    sendMessage.mockClear()
    run({ href: 'file:///Users/test/Documents/image.png' }, makeDocument(), { runtime: { sendMessage } }, URL)
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('stores the captured file for the tab and redirects to reader mode', async () => {
    let messageListener: ((message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean) | undefined
    const storageSet = vi.fn().mockResolvedValue(undefined)
    const tabsUpdate = vi.fn().mockResolvedValue(undefined)
    const chromeMock = {
      action: { onClicked: { addListener: vi.fn() } },
      runtime: {
        getURL: (path: string) => `chrome-extension://test/${path}`,
        onMessage: { addListener: (listener: typeof messageListener) => { messageListener = listener } },
      },
      storage: { session: { set: storageSet, remove: vi.fn().mockResolvedValue(undefined) } },
      tabs: {
        query: vi.fn(), update: tabsUpdate, create: vi.fn(),
        onRemoved: { addListener: vi.fn() },
      },
      windows: { update: vi.fn() },
    }
    new Function('chrome', backgroundSource)(chromeMock)

    const sendResponse = vi.fn()
    const keepChannelOpen = messageListener?.(
      { type: 'OPEN_LOCAL_MARKDOWN', payload: { name: 'note.md', markdown: '# Note' } },
      { tab: { id: 27 } },
      sendResponse,
    )
    expect(keepChannelOpen).toBe(true)
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true }))
    expect(storageSet).toHaveBeenCalledWith({
      'local-md-reader-single-file-27': { name: 'note.md', markdown: '# Note' },
    })
    expect(tabsUpdate).toHaveBeenCalledWith(27, { url: 'chrome-extension://test/reader.html?single=27' })
  })
})
