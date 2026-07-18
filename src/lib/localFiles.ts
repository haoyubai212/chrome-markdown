import { isImageFile, isMarkdownFile, normalizePath, shouldIncludeName } from './paths'
import type { TreeNode } from '../types'

export type LocalReadKind = 'directory' | 'markdown' | 'asset'

type LocalReadResponse = {
  ok: boolean
  text?: string
  dataUrl?: string
  error?: string
}

const DIRECTORY_ROW_PATTERN = /addRow\("((?:\\.|[^"\\])*)",\s*"((?:\\.|[^"\\])*)",\s*(\d+)/g

function decodeDirectoryString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value
  }
}

export function parentDirectoryUrl(sourceUrl: string): string {
  const source = new URL(sourceUrl)
  if (source.protocol !== 'file:' || source.pathname.endsWith('/')) throw new Error('Invalid local Markdown URL')
  source.hash = ''
  source.search = ''
  source.pathname = source.pathname.replace(/[^/]+$/, '')
  return source.href
}

export function localUrlForPath(rootUrl: string, path: string): string | null {
  try {
    const root = new URL(rootUrl)
    const normalized = normalizePath(path)
    if (root.protocol !== 'file:' || !root.pathname.endsWith('/') || !normalized) return null
    const encodedPath = normalized.split('/').map(encodeURIComponent).join('/')
    const target = new URL(encodedPath, root)
    return target.href.startsWith(root.href) ? target.href : null
  } catch {
    return null
  }
}

export function localPathFromUrl(rootUrl: string, targetUrl: string): string | null {
  try {
    const root = new URL(rootUrl)
    const target = new URL(targetUrl)
    if (root.protocol !== 'file:' || target.protocol !== 'file:' || root.host !== target.host || !root.pathname.endsWith('/')) return null
    if (!target.href.startsWith(root.href) || target.pathname.endsWith('/')) return null
    return normalizePath(target.pathname.slice(root.pathname.length).split('/').map(decodeURIComponent).join('/')) || null
  } catch {
    return null
  }
}

export function localDirectoryName(directoryUrl: string): string {
  try {
    const segments = new URL(directoryUrl).pathname.split('/').filter(Boolean)
    return decodeURIComponent(segments.at(-1) || '') || '本地文件'
  } catch {
    return '本地文件'
  }
}

export function isAllowedLocalTarget(sourceUrl: string, targetUrl: string, kind: LocalReadKind, rootUrl?: string): boolean {
  try {
    const source = new URL(sourceUrl)
    const target = new URL(targetUrl)
    if (source.protocol !== 'file:' || target.protocol !== 'file:' || source.host !== target.host) return false
    if (source.pathname.endsWith('/') || source.search || source.hash || target.search || target.hash) return false
    const root = rootUrl ? new URL(rootUrl).href : parentDirectoryUrl(source.href)
    if (!root.endsWith('/') || !source.href.startsWith(root)) return false
    if (!target.href.startsWith(root)) return false
    if (kind === 'directory') return target.pathname.endsWith('/')
    if (target.pathname.endsWith('/')) return false
    return kind === 'markdown' ? isMarkdownFile(target.pathname) : isImageFile(target.pathname)
  } catch {
    return false
  }
}

export function parseChromeDirectoryIndex(
  html: string,
  directoryUrl: string,
  parentPath = '',
  showHidden = false,
): TreeNode[] {
  const baseUrl = directoryUrl.endsWith('/') ? directoryUrl : `${directoryUrl}/`
  const nodes: TreeNode[] = []
  DIRECTORY_ROW_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = DIRECTORY_ROW_PATTERN.exec(html)) !== null) {
    const rawName = decodeDirectoryString(match[1]).replace(/\/$/, '')
    const rowPath = decodeDirectoryString(match[2])
    const isDirectory = Number.parseInt(match[3], 10) === 1
    if (!rawName || !shouldIncludeName(rawName, showHidden)) continue
    if (!isDirectory && !isMarkdownFile(rawName)) continue
    const url = new URL(rowPath, baseUrl)
    if (isDirectory && !url.pathname.endsWith('/')) url.pathname += '/'
    if (!url.href.startsWith(baseUrl) || url.href === baseUrl) continue
    const path = normalizePath(parentPath ? `${parentPath}/${rawName}` : rawName)
    if (!path) continue
    nodes.push(isDirectory
      ? { kind: 'directory', name: rawName, path, url: url.href, children: [], loaded: false }
      : { kind: 'file', name: rawName, path, url: url.href })
  }
  return nodes.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'directory' ? -1 : 1
    return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
  })
}

export function replaceDirectoryChildren(nodes: TreeNode[], path: string, children: TreeNode[]): TreeNode[] {
  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.kind !== 'directory') return node
    if (node.path === path) {
      changed = true
      return { ...node, children, loaded: true }
    }
    const nextChildren = replaceDirectoryChildren(node.children, path, children)
    if (nextChildren === node.children) return node
    changed = true
    return { ...node, children: nextChildren }
  })
  return changed ? nextNodes : nodes
}

async function readLocalUrl(sourceUrl: string, targetUrl: string, kind: LocalReadKind, rootUrl?: string): Promise<string> {
  if (!globalThis.chrome?.runtime?.sendMessage) throw new Error('Local file bridge is unavailable')
  const response = await chrome.runtime.sendMessage({
    type: 'READ_LOCAL_URL',
    payload: { sourceUrl, targetUrl, kind, ...(rootUrl ? { rootUrl } : {}) },
  }) as LocalReadResponse
  if (!response?.ok || typeof response.text !== 'string') throw new Error(response?.error || 'Could not read local file')
  return response.text
}

export async function readLocalDirectory(
  sourceUrl: string,
  directoryUrl: string,
  parentPath = '',
  showHidden = false,
  rootUrl?: string,
): Promise<TreeNode[]> {
  const html = await readLocalUrl(sourceUrl, directoryUrl, 'directory', rootUrl)
  return parseChromeDirectoryIndex(html, directoryUrl, parentPath, showHidden)
}

export function readLocalMarkdown(sourceUrl: string, targetUrl: string, rootUrl?: string): Promise<string> {
  return readLocalUrl(sourceUrl, targetUrl, 'markdown', rootUrl)
}

export async function readLocalAsset(sourceUrl: string, targetUrl: string, rootUrl?: string): Promise<string> {
  if (!globalThis.chrome?.runtime?.sendMessage) throw new Error('Local file bridge is unavailable')
  const response = await chrome.runtime.sendMessage({
    type: 'READ_LOCAL_URL',
    payload: { sourceUrl, targetUrl, kind: 'asset', ...(rootUrl ? { rootUrl } : {}) },
  }) as LocalReadResponse
  if (!response?.ok || typeof response.dataUrl !== 'string') throw new Error(response?.error || 'Could not read local asset')
  return response.dataUrl
}
