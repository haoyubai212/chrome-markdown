import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import highlightStyles from 'highlight.js/styles/github.css?inline'
import katexStyles from 'katex/dist/katex.min.css?inline'
import appStyles from './styles/app.css?inline'
import App from './App'
import { captureMarkdownDocument } from './lib/contentSource'
import { applyReaderTitle, installReaderFavicon } from './lib/documentMetadata'
import { loadPersistedSettings } from './lib/storage'

function revealDocument() {
  document.documentElement.style.visibility = ''
}

async function mountReader() {
  const initialFile = captureMarkdownDocument(location.href, document)
  if (!initialFile) {
    revealDocument()
    return
  }

  if (document.getElementById('root')) {
    revealDocument()
    return
  }

  installReaderFavicon(document, chrome.runtime.getURL('icons/icon-32.png'))
  applyReaderTitle(document)

  const style = document.createElement('style')
  style.dataset.localMdReader = 'styles'
  style.textContent = `${highlightStyles}\n${katexStyles}\n${appStyles}`
  document.head.append(style)

  const root = document.createElement('div')
  root.id = 'root'

  document.documentElement.style.width = '100%'
  document.documentElement.style.height = '100%'
  document.documentElement.style.overflow = 'hidden'
  document.body.classList.add('chrome-markdown-active')
  document.body.style.width = '100%'
  document.body.style.height = '100%'
  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'
  document.body.append(root)

  const initialSettings = await loadPersistedSettings()
  createRoot(root).render(
    <StrictMode>
      <App
        initialFile={initialFile}
        initialSettings={initialSettings}
      />
    </StrictMode>,
  )
  requestAnimationFrame(revealDocument)
}

void mountReader().catch(revealDocument)
