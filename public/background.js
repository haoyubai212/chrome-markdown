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

const markdownExtension = /\.(?:md|markdown|mdown|mkd|mdx)$/i
const imageExtension = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i
const navigationKey = (tabId) => `local-navigation:${tabId}`

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

const normalizeFileUrl = (value) => {
  const url = new URL(value)
  url.hash = ''
  url.search = ''
  return url.href
}

const isAllowedLocalTarget = (sourceUrl, targetUrl, kind, rootUrl) => {
  try {
    const source = new URL(sourceUrl)
    const target = new URL(targetUrl)
    if (source.protocol !== 'file:' || target.protocol !== 'file:' || source.host !== target.host) return false
    if (source.pathname.endsWith('/') || source.search || source.hash || target.search || target.hash) return false
    const root = new URL(rootUrl || parentDirectoryUrl(source.href))
    if (root.protocol !== 'file:' || root.host !== source.host || !root.pathname.endsWith('/') || root.search || root.hash) return false
    if (!source.href.startsWith(root.href)) return false
    if (!target.href.startsWith(root.href)) return false
    if (kind === 'directory') return target.pathname.endsWith('/')
    if (target.pathname.endsWith('/')) return false
    if (kind === 'markdown') return markdownExtension.test(target.pathname)
    return kind === 'asset' && imageExtension.test(target.pathname)
  } catch {
    return false
  }
}

const normalizeExpandedPaths = (value) => {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((path) => typeof path === 'string' && path.length > 0 && path.length <= 1024)
    .slice(0, 200))]
}

const loadNavigationState = async (tabId) => {
  if (!Number.isInteger(tabId) || !chrome.storage?.session) return null
  const key = navigationKey(tabId)
  const stored = await chrome.storage.session.get(key)
  const state = stored[key]
  if (!state || typeof state.rootUrl !== 'string' || typeof state.targetUrl !== 'string') return null
  return {
    rootUrl: state.rootUrl,
    targetUrl: state.targetUrl,
    expandedPaths: normalizeExpandedPaths(state.expandedPaths),
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SAVE_LOCAL_NAVIGATION_STATE') {
    const tabId = sender.tab?.id
    const senderUrl = sender.url ?? sender.tab?.url
    const { rootUrl, targetUrl, expandedPaths } = message.payload ?? {}
    if (!Number.isInteger(tabId) || typeof senderUrl !== 'string' || typeof rootUrl !== 'string' || typeof targetUrl !== 'string') {
      sendResponse({ ok: false, error: '无效的导航状态' })
      return false
    }
    let sourceUrl
    try { sourceUrl = normalizeFileUrl(senderUrl) } catch {
      sendResponse({ ok: false, error: '无效的导航状态' })
      return false
    }
    if (!isAllowedLocalTarget(sourceUrl, targetUrl, 'markdown', rootUrl)) {
      sendResponse({ ok: false, error: '导航目标超出当前目录范围' })
      return false
    }
    const state = { rootUrl, targetUrl: normalizeFileUrl(targetUrl), expandedPaths: normalizeExpandedPaths(expandedPaths) }
    chrome.storage.session.set({ [navigationKey(tabId)]: state })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    return true
  }

  if (message?.type === 'LOAD_LOCAL_NAVIGATION_STATE') {
    const tabId = sender.tab?.id
    const senderUrl = sender.url ?? sender.tab?.url
    if (!Number.isInteger(tabId) || typeof senderUrl !== 'string') {
      sendResponse({ ok: true, state: null })
      return false
    }
    let sourceUrl
    try { sourceUrl = normalizeFileUrl(senderUrl) } catch {
      sendResponse({ ok: true, state: null })
      return false
    }
    loadNavigationState(tabId)
      .then(async (state) => {
        if (!state || !isAllowedLocalTarget(sourceUrl, sourceUrl, 'markdown', state.rootUrl)) {
          await chrome.storage.session.remove(navigationKey(tabId))
          sendResponse({ ok: true, state: null })
          return
        }
        sendResponse({ ok: true, state })
      })
      .catch(() => sendResponse({ ok: true, state: null }))
    return true
  }

  if (message?.type === 'READ_LOCAL_URL') {
    const { sourceUrl, targetUrl, kind, rootUrl } = message.payload ?? {}
    const senderUrl = sender.url ?? sender.tab?.url
    if (typeof senderUrl !== 'string' || typeof sourceUrl !== 'string' || typeof targetUrl !== 'string') {
      sendResponse({ ok: false, error: '无效的本地文件请求' })
      return false
    }
    const senderSource = new URL(senderUrl)
    senderSource.hash = ''
    senderSource.search = ''
    if (senderSource.href !== sourceUrl) {
      sendResponse({ ok: false, error: '本地文件请求超出当前目录范围' })
      return false
    }
    const readTarget = () => fetch(targetUrl)
      .then(async (response) => {
        if (kind !== 'asset') return { text: await response.text() }
        const buffer = await response.arrayBuffer()
        return { dataUrl: `data:${response.headers.get('content-type') || imageMimeType(new URL(targetUrl).pathname)};base64,${encodeBase64(buffer)}` }
      })
      .then((payload) => sendResponse({ ok: true, ...payload }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))

    if (!rootUrl) {
      if (!isAllowedLocalTarget(sourceUrl, targetUrl, kind)) {
        sendResponse({ ok: false, error: '本地文件请求超出当前目录范围' })
        return false
      }
      readTarget()
      return true
    }

    if (rootUrl === parentDirectoryUrl(sourceUrl)) {
      if (!isAllowedLocalTarget(sourceUrl, targetUrl, kind, rootUrl)) {
        sendResponse({ ok: false, error: '本地文件请求超出当前目录范围' })
        return false
      }
      readTarget()
      return true
    }

    loadNavigationState(sender.tab?.id)
      .then((state) => {
        if (!state || state.rootUrl !== rootUrl || !isAllowedLocalTarget(sourceUrl, targetUrl, kind, rootUrl)) {
          sendResponse({ ok: false, error: '本地文件请求超出当前目录范围' })
          return
        }
        readTarget()
      })
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    return true
  }

  return false
})
