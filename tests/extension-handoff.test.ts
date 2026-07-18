import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { captureMarkdownDocument } from '../src/lib/contentSource'

const fileHandlerSource = readFileSync(resolve('public/file-handler.js'), 'utf8')
const manifest = JSON.parse(readFileSync(resolve('public/manifest.json'), 'utf8')) as {
  content_scripts: Array<{ js: string[] }>
  web_accessible_resources: Array<{ resources: string[] }>
}

describe('local file content entry', () => {
  it('captures Markdown directly from the original file page', () => {
    document.body.innerHTML = '<pre># 本地笔记</pre>'
    expect(captureMarkdownDocument('file:///Users/test/Documents/%E7%AC%94%E8%AE%B0.md', document)).toEqual({
      name: '笔记.md',
      parentName: 'Documents',
      markdown: '# 本地笔记',
      sourceUrl: 'file:///Users/test/Documents/%E7%AC%94%E8%AE%B0.md',
    })
    expect(captureMarkdownDocument('file:///Users/test/Documents/image.png', document)).toBeNull()
  })

  it('keeps the source file URL and strips only search/hash state', () => {
    document.body.innerHTML = '<pre># Note</pre>'
    const captured = captureMarkdownDocument('file:///Users/test/Documents/note.md?raw=1#section', document)
    expect(captured?.sourceUrl).toBe('file:///Users/test/Documents/note.md')
    expect(captured?.markdown).toBe('# Note')
  })

  it('loads the React content entry without redirecting or session handoff', () => {
    expect(fileHandlerSource).toContain("import(chrome.runtime.getURL('content.js'))")
    expect(fileHandlerSource).not.toContain('sendMessage')
    expect(fileHandlerSource).not.toContain('location.href =')
    expect(manifest.content_scripts[0].js).toEqual(['file-handler.js'])
    expect(manifest.web_accessible_resources[0].resources).toContain('content.js')
  })
})
