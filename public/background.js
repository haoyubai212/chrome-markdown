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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'OPEN_LOCAL_MARKDOWN') return false
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
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.storage.session.remove(singleFileStorageKey(tabId))
})
