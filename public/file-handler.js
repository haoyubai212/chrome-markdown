(() => {
  const markdownExtension = /\.(?:md|markdown|mdown|mkd|mdx)$/i
  const url = new URL(location.href)
  if (!markdownExtension.test(url.pathname)) return
  if (document.documentElement.dataset.localMdReaderHandled === 'true') return

  const pre = document.querySelector('pre')
  const markdown = pre?.textContent ?? document.body?.innerText ?? ''
  if (!markdown) return

  const segments = url.pathname.split('/').filter(Boolean).map((segment) => {
    try { return decodeURIComponent(segment) } catch { return segment }
  })
  const name = segments.at(-1) || 'document.md'
  const parentName = segments.at(-2) || '本地文件'
  document.documentElement.dataset.localMdReaderHandled = 'true'

  chrome.runtime.sendMessage({
    type: 'OPEN_LOCAL_MARKDOWN',
    payload: { name, parentName, markdown, sourceUrl: url.href },
  }).catch(() => {
    delete document.documentElement.dataset.localMdReaderHandled
  })
})()
