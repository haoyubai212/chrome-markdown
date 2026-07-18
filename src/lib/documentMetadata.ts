const FAVICON_ID = 'local-md-reader-favicon'

function faviconLinks(sourceDocument: Document): HTMLLinkElement[] {
  return Array.from(sourceDocument.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'))
}

export function applyReaderFavicon(sourceDocument: Document, iconUrl: string): void {
  for (const link of faviconLinks(sourceDocument)) {
    if (link.id !== FAVICON_ID) link.remove()
  }

  let favicon = sourceDocument.getElementById(FAVICON_ID) as HTMLLinkElement | null
  if (!favicon) {
    favicon = sourceDocument.createElement('link')
    favicon.id = FAVICON_ID
    sourceDocument.head.append(favicon)
  }
  if (favicon.rel !== 'icon') favicon.rel = 'icon'
  if (favicon.type !== 'image/png') favicon.type = 'image/png'
  if (favicon.href !== iconUrl) favicon.href = iconUrl
}

export function installReaderFavicon(sourceDocument: Document, iconUrl: string): () => void {
  applyReaderFavicon(sourceDocument, iconUrl)
  let applying = false
  const observer = new MutationObserver(() => {
    if (applying) return
    applying = true
    applyReaderFavicon(sourceDocument, iconUrl)
    queueMicrotask(() => { applying = false })
  })
  observer.observe(sourceDocument.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'rel', 'type'],
  })
  return () => observer.disconnect()
}

export function applyReaderTitle(sourceDocument: Document, fileName?: string): void {
  sourceDocument.title = fileName ? `${fileName} — Local MD Reader` : 'Local MD Reader'
}
