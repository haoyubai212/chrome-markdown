import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import markedKatex from 'marked-katex-extension'
import type { Heading } from '../types'

function slugify(text: string, used: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-') || 'section'
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count ? `${base}-${count}` : base
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; headings: Heading[] }> {
  const parser = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, language) {
        const resolved = language && hljs.getLanguage(language) ? language : 'plaintext'
        return hljs.highlight(code, { language: resolved }).value
      },
    }),
    markedKatex({ throwOnError: false, nonStandard: true, strict: false }),
    { gfm: true, breaks: false },
  )

  const raw = await parser.parse(markdown)
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'mfrac'],
    ADD_ATTR: ['target', 'rel', 'aria-hidden', 'xmlns'],
  })
  const document = new DOMParser().parseFromString(clean, 'text/html')
  const headings: Heading[] = []
  const used = new Map<string, number>()
  for (const element of document.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')) {
    const text = element.textContent?.trim() ?? ''
    const id = slugify(text, used)
    element.id = id
    element.classList.add('heading-anchor')
    headings.push({ id, level: Number(element.tagName.slice(1)), text })
  }
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a')) {
    if (/^https?:/i.test(anchor.href)) {
      anchor.target = '_blank'
      anchor.rel = 'noreferrer noopener'
    }
  }
  return { html: document.body.innerHTML, headings }
}
