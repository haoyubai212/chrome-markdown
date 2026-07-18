(() => {
  const markdownExtension = /\.(?:md|markdown|mdown|mkd|mdx)$/i
  const url = new URL(location.href)
  if (!markdownExtension.test(url.pathname)) return
  if (document.documentElement.dataset.localMdReaderHandled === 'true') return

  document.documentElement.dataset.localMdReaderHandled = 'true'

  import(chrome.runtime.getURL('content.js')).catch(() => {
    delete document.documentElement.dataset.localMdReaderHandled
  })
})()
