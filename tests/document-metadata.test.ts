import { afterEach, describe, expect, it } from 'vitest'
import { applyReaderFavicon, applyReaderTitle, installReaderFavicon } from '../src/lib/documentMetadata'

afterEach(() => {
  document.head.innerHTML = ''
  document.title = ''
})

describe('reader document metadata', () => {
  it('replaces competing favicons with the Chrome Markdown icon', () => {
    document.head.innerHTML = '<link rel="icon" href="chrome-extension://markdown-reader/icon.png">'
    applyReaderFavicon(document, 'chrome-extension://chrome-markdown/icons/icon-32.png')
    const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    expect(links).toHaveLength(1)
    expect(links[0].id).toBe('chrome-markdown-favicon')
    expect(links[0].href).toBe('chrome-extension://chrome-markdown/icons/icon-32.png')
  })

  it('restores its favicon when another extension adds one later', async () => {
    const disconnect = installReaderFavicon(document, 'chrome-extension://chrome-markdown/icons/icon-32.png')
    const competing = document.createElement('link')
    competing.rel = 'icon'
    competing.href = 'chrome-extension://markdown-reader/icon.png'
    document.head.append(competing)
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()))
    expect(document.head.querySelectorAll('link[rel~="icon"]')).toHaveLength(1)
    expect(document.getElementById('chrome-markdown-favicon')).not.toBeNull()
    disconnect()
  })

  it('keeps the tab title fixed to the product name', () => {
    applyReaderTitle(document)
    expect(document.title).toBe('Chrome Markdown')
  })
})
