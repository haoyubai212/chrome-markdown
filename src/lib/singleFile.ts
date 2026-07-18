import type { LoadedDocument } from '../types'

export type CapturedMarkdownFile = {
  name: string
  parentName: string
  markdown: string
  sourceUrl: string
  lastModified?: number
}

export function toLoadedDocument(file: CapturedMarkdownFile): LoadedDocument {
  return {
    path: file.name,
    name: file.name,
    markdown: file.markdown,
    lastModified: file.lastModified ?? Date.now(),
    sourceUrl: file.sourceUrl,
  }
}

export function relativePathFromSource(sourceUrl: string, directoryName: string): string | null {
  try {
    const segments = new URL(sourceUrl).pathname.split('/').filter(Boolean).map(decodeURIComponent)
    const rootIndex = segments.lastIndexOf(directoryName)
    if (rootIndex === -1 || rootIndex === segments.length - 1) return null
    return segments.slice(rootIndex + 1).join('/')
  } catch {
    return null
  }
}
