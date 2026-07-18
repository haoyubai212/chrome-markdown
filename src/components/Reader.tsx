import { useEffect, useRef, useState } from 'react'
import { translate } from '../lib/i18n'
import type { Language, LoadedDocument } from '../types'
import { readAssetUrl } from '../lib/filesystem'
import { isImageFile, isMarkdownFile, resolveRelativePath } from '../lib/paths'

type ReaderProps = {
  document: LoadedDocument | null
  html: string
  rootHandle?: FileSystemDirectoryHandle
  fontSize: number
  language: Language
  onOpenPath: (path: string) => void
}

let mermaidInitialized = false

export function Reader({ document, html, rootHandle, fontSize, language, onOpenPath }: ReaderProps) {
  const articleRef = useRef<HTMLElement>(null)
  const [renderError, setRenderError] = useState('')

  useEffect(() => {
    const article = articleRef.current
    if (!article || !document) return
    const objectUrls = new Set<string>()
    let cancelled = false

    async function hydrateAssets() {
      if (!rootHandle) return
      const images = Array.from(article!.querySelectorAll<HTMLImageElement>('img'))
      await Promise.all(images.map(async (image) => {
        const source = image.getAttribute('src') ?? ''
        const resolved = resolveRelativePath(document!.path, source)
        if (!resolved || !isImageFile(resolved)) return
        const url = await readAssetUrl(rootHandle, resolved, objectUrls)
        if (!cancelled && url) image.src = url
      }))
    }

    async function hydrateMermaid() {
      const nodes = Array.from(article!.querySelectorAll<HTMLElement>('code.language-mermaid'))
      if (!nodes.length) return
      const { default: mermaid } = await import('mermaid')
      if (!mermaidInitialized) {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
        mermaidInitialized = true
      }
      nodes.forEach((node) => node.parentElement?.classList.add('mermaid-container'))
      await mermaid.run({ nodes })
    }

    setRenderError('')
    Promise.all([hydrateAssets(), hydrateMermaid()]).catch((error: unknown) => {
      if (!cancelled) setRenderError(error instanceof Error ? error.message : translate(language, 'diagramFailed'))
    })
    return () => {
      cancelled = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [document, html, language, rootHandle])

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a')
    if (!anchor || !document) return
    const href = anchor.getAttribute('href') ?? ''
    if (href.startsWith('#')) return
    const resolved = resolveRelativePath(document.path, href)
    if (!resolved || !isMarkdownFile(resolved)) return
    event.preventDefault()
    onOpenPath(resolved)
  }

  if (!document) {
    return (
      <main className="reader-empty">
        <div className="empty-mark">M↓</div>
        <h1>Local MD Reader</h1>
        <p>{translate(language, 'chooseFile')}</p>
      </main>
    )
  }

  return (
    <main className="reader-scroll">
      {renderError ? <div className="render-warning">{translate(language, 'partialDiagram', { error: renderError })}</div> : null}
      <article
        ref={articleRef}
        className="markdown-body"
        style={{ '--reader-font-size': `${fontSize}px` } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
    </main>
  )
}
