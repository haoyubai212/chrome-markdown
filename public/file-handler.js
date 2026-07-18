(() => {
  const markdownExtension = /\.(?:md|markdown|mdown|mkd|mdx)$/i
  const url = new URL(location.href)
  if (!markdownExtension.test(url.pathname)) return
  if (document.documentElement.dataset.localMdReaderHandled === 'true') return

  document.documentElement.dataset.localMdReaderHandled = 'true'
  document.documentElement.style.visibility = 'hidden'

  const loadReader = () => {
    import(chrome.runtime.getURL('content.js')).catch(() => {
      delete document.documentElement.dataset.localMdReaderHandled
      document.documentElement.style.visibility = ''
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadReader, { once: true })
  else loadReader()
})()
