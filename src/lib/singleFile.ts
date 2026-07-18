import type { LoadedDocument } from '../types'

export type CapturedMarkdownFile = {
  name: string
  parentName: string
  markdown: string
  sourceUrl: string
  lastModified?: number
}

export function singleFileStorageKey(tabId: string): string {
  return `local-md-reader-single-file-${tabId}`
}

export async function loadCapturedMarkdown(tabId: string): Promise<CapturedMarkdownFile> {
  if (!globalThis.chrome?.storage?.session) throw new Error('无法访问浏览器的临时文件缓存')
  const key = singleFileStorageKey(tabId)
  const stored = await chrome.storage.session.get(key)
  const value = stored[key] as Partial<CapturedMarkdownFile> | undefined
  if (!value || typeof value.name !== 'string' || typeof value.markdown !== 'string') {
    throw new Error('无法读取这个 Markdown 文件，请返回原文件页后重新打开')
  }
  return {
    name: value.name,
    parentName: typeof value.parentName === 'string' ? value.parentName : '本地文件',
    markdown: value.markdown,
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : '',
    lastModified: typeof value.lastModified === 'number' ? value.lastModified : undefined,
  }
}

export function toLoadedDocument(file: CapturedMarkdownFile): LoadedDocument {
  return {
    path: file.name,
    name: file.name,
    markdown: file.markdown,
    lastModified: file.lastModified ?? Date.now(),
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
