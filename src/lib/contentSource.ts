import type { CapturedMarkdownFile } from './singleFile'

const MARKDOWN_PATH = /\.(?:md|markdown|mdown|mkd|mdx)$/i

function decodePathSegment(segment: string): string {
  try { return decodeURIComponent(segment) } catch { return segment }
}

export function captureMarkdownDocument(sourceHref: string, sourceDocument: Document): CapturedMarkdownFile | null {
  const source = new URL(sourceHref)
  if (source.protocol !== 'file:' || !MARKDOWN_PATH.test(source.pathname)) return null
  const markdown = sourceDocument.querySelector('pre')?.textContent ?? sourceDocument.body?.innerText ?? ''
  if (!markdown) return null
  source.hash = ''
  source.search = ''
  const segments = source.pathname.split('/').filter(Boolean).map(decodePathSegment)
  return {
    name: segments.at(-1) || 'document.md',
    parentName: segments.at(-2) || '本地文件',
    markdown,
    sourceUrl: source.href,
  }
}
