chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('reader.html')
  const tabs = await chrome.tabs.query({ url })
  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, { active: true })
    if (tabs[0].windowId) await chrome.windows.update(tabs[0].windowId, { focused: true })
    return
  }
  await chrome.tabs.create({ url })
})

const singleFileStorageKey = (tabId) => `local-md-reader-single-file-${tabId}`

const markdownExtension = /\.(?:md|markdown|mdown|mkd|mdx)$/i
const imageExtension = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i

const imageMimeType = (pathname) => {
  const extension = pathname.split('.').at(-1)?.toLowerCase()
  return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' })[extension] ?? 'application/octet-stream'
}

const encodeBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

const parentDirectoryUrl = (sourceUrl) => {
  const source = new URL(sourceUrl)
  source.hash = ''
  source.search = ''
  source.pathname = source.pathname.replace(/[^/]+$/, '')
  return source.href
}

const isAllowedLocalTarget = (sourceUrl, targetUrl, kind) => {
  try {
    const source = new URL(sourceUrl)
    const target = new URL(targetUrl)
    if (source.protocol !== 'file:' || target.protocol !== 'file:' || source.host !== target.host) return false
    if (source.pathname.endsWith('/') || source.search || source.hash || target.search || target.hash) return false
    const root = parentDirectoryUrl(source.href)
    if (!target.href.startsWith(root)) return false
    if (kind === 'directory') return target.pathname.endsWith('/')
    if (target.pathname.endsWith('/')) return false
    if (kind === 'markdown') return markdownExtension.test(target.pathname)
    return kind === 'asset' && imageExtension.test(target.pathname)
  } catch {
    return false
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'OPEN_LOCAL_MARKDOWN') {
    const tabId = sender.tab?.id
    if (!Number.isInteger(tabId) || typeof message.payload?.markdown !== 'string') {
      sendResponse({ ok: false, error: '缺少文件或标签页信息' })
      return false
    }

    const key = singleFileStorageKey(tabId)
    chrome.storage.session.set({ [key]: message.payload })
      .then(() => chrome.tabs.update(tabId, { url: chrome.runtime.getURL(`reader.html?single=${tabId}`) }))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    return true
  }

  if (message?.type === 'READ_LOCAL_URL') {
    const tabId = sender.tab?.id
    const { sourceUrl, targetUrl, kind } = message.payload ?? {}
    if (!Number.isInteger(tabId) || typeof sourceUrl !== 'string' || typeof targetUrl !== 'string') {
      sendResponse({ ok: false, error: '无效的本地文件请求' })
      return false
    }
    const key = singleFileStorageKey(tabId)
    chrome.storage.session.get(key)
      .then((stored) => {
        const capturedSource = stored[key]?.sourceUrl
        if (capturedSource !== sourceUrl || !isAllowedLocalTarget(sourceUrl, targetUrl, kind)) {
          throw new Error('本地文件请求超出当前目录范围')
        }
        return fetch(targetUrl)
      })
      .then(async (response) => {
        if (kind !== 'asset') return { text: await response.text() }
        const buffer = await response.arrayBuffer()
        return { dataUrl: `data:${response.headers.get('content-type') || imageMimeType(new URL(targetUrl).pathname)};base64,${encodeBase64(buffer)}` }
      })
      .then((payload) => sendResponse({ ok: true, ...payload }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    return true
  }

  return false
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.storage.session.remove(singleFileStorageKey(tabId))
})
