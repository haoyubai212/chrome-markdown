import type { TreeNode } from '../types'

export const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdown', 'mkd', 'mdx'])
export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'])
export const DEFAULT_IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.svn', '.hg', 'dist', 'build'])

export function extensionOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index === -1 ? '' : name.slice(index + 1).toLowerCase()
}

export function isMarkdownFile(name: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extensionOf(name))
}

export function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.has(extensionOf(name))
}

export function shouldIncludeName(name: string, showHidden: boolean): boolean {
  if (name === '.DS_Store') return false
  if (!showHidden && name.startsWith('.')) return false
  return !DEFAULT_IGNORED_DIRECTORIES.has(name)
}

export function normalizePath(path: string): string {
  const parts: string[] = []
  for (const part of path.replaceAll('\\', '/').split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

export function dirname(path: string): string {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? '' : normalized.slice(0, index)
}

export function resolveRelativePath(fromFile: string, target: string): string | null {
  const cleanTarget = target.split('#')[0].split('?')[0]
  if (!cleanTarget || /^(?:[a-z]+:|#)/i.test(target)) return null
  if (cleanTarget.startsWith('/')) return normalizePath(decodeURIComponent(cleanTarget))
  return normalizePath(`${dirname(fromFile)}/${decodeURIComponent(cleanTarget)}`)
}

export function flattenFiles(nodes: TreeNode[]): Extract<TreeNode, { kind: 'file' }>[] {
  const files: Extract<TreeNode, { kind: 'file' }>[] = []
  const visit = (items: TreeNode[]) => {
    for (const item of items) {
      if (item.kind === 'file') files.push(item)
      else visit(item.children)
    }
  }
  visit(nodes)
  return files
}

export function findNode(nodes: TreeNode[], path: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.kind === 'directory') {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
}
