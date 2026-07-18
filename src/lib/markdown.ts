import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import markedKatex from 'marked-katex-extension'
import { parseDocument } from 'yaml'
import type { Heading } from '../types'

type Frontmatter = {
  source: string
  body: string
}

function extractFrontmatter(markdown: string): Frontmatter | null {
  const normalized = markdown.replace(/^\uFEFF/, '')
  const match = normalized.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/)
  if (!match) return null
  return { source: match[1], body: normalized.slice(match[0].length) }
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return '[complex value]' }
  }
  return String(value)
}

function createFrontmatterCard(document: Document, source: string): HTMLElement {
  const card = document.createElement('aside')
  card.className = 'frontmatter-card'
  card.setAttribute('aria-label', 'Frontmatter')
  let values: unknown = null
  try {
    const parsed = parseDocument(source, { prettyErrors: false, schema: 'core' })
    if (!parsed.errors.length) values = parsed.toJS({ maxAliasCount: 50 }) as unknown
  } catch {
    // Invalid or excessively aliased YAML falls back to a read-only raw block.
  }

  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    const raw = document.createElement('pre')
    raw.className = 'frontmatter-raw'
    raw.textContent = source
    card.append(raw)
    return card
  }

  const list = document.createElement('dl')
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    const row = document.createElement('div')
    row.className = 'frontmatter-row'
    const name = document.createElement('dt')
    name.textContent = key
    const content = document.createElement('dd')
    if (Array.isArray(value)) {
      content.className = 'frontmatter-values'
      for (const item of value) {
        const chip = document.createElement('span')
        chip.className = 'frontmatter-chip'
        chip.textContent = displayValue(item)
        content.append(chip)
      }
    } else {
      content.textContent = displayValue(value)
    }
    row.append(name, content)
    list.append(row)
  }
  card.append(list)
  return card
}

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
  const frontmatter = extractFrontmatter(markdown)
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

  const raw = await parser.parse(frontmatter?.body ?? markdown)
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'link'],
    ADD_TAGS: ['math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'mfrac'],
    ADD_ATTR: ['target', 'rel', 'aria-hidden', 'xmlns'],
  })
  const document = new DOMParser().parseFromString(clean, 'text/html')
  if (frontmatter) document.body.prepend(createFrontmatterCard(document, frontmatter.source))
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
