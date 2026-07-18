import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import './styles/app.css'
import App from './App'
import { loadPersistedSettings } from './lib/storage'

loadPersistedSettings().then((initialSettings) => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App initialSettings={initialSettings} /></StrictMode>)
})
