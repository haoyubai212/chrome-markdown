import { useMemo, useState } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import { translate } from '../lib/i18n'
import type { Language, TreeNode } from '../types'

type FileTreeProps = {
  nodes: TreeNode[]
  activePath: string
  query: string
  language: Language
  expandedPaths: ReadonlySet<string>
  onOpen: (path: string) => void
  onExpandDirectory: (path: string, url: string) => Promise<void>
  onDirectoryExpandedChange: (path: string, expanded: boolean) => void
}

function containsMatch(node: TreeNode, query: string): boolean {
  if (!query) return true
  if (node.name.toLowerCase().includes(query)) return true
  return node.kind === 'directory' && node.children.some((child) => containsMatch(child, query))
}

function TreeItem({ node, depth, activePath, query, expandedPaths, onOpen, onExpandDirectory, onDirectoryExpandedChange }: {
  node: TreeNode
  depth: number
  activePath: string
  query: string
  expandedPaths: ReadonlySet<string>
  onOpen: (path: string) => void
  onExpandDirectory: (path: string, url: string) => Promise<void>
  onDirectoryExpandedChange: (path: string, expanded: boolean) => void
}) {
  const matches = containsMatch(node, query)
  const [loading, setLoading] = useState(false)
  if (!matches) return null

  if (node.kind === 'file') {
    return (
      <button
        className={`tree-row tree-file ${activePath === node.path ? 'is-active' : ''}`}
        style={{ paddingInlineStart: 12 + depth * 18 }}
        onClick={() => onOpen(node.path)}
        title={node.path}
      >
        <FileText size={15} aria-hidden="true" />
        <span>{node.name}</span>
      </button>
    )
  }

  const directory = node
  const expanded = expandedPaths.has(directory.path)
  const isExpanded = query ? true : expanded
  async function toggleDirectory() {
    const nextExpanded = !expanded
    onDirectoryExpandedChange(directory.path, nextExpanded)
    if (!nextExpanded || directory.loaded !== false || !directory.url) return
    setLoading(true)
    try {
      await onExpandDirectory(directory.path, directory.url)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="tree-directory">
      <button
        className="tree-row"
        style={{ paddingInlineStart: 8 + depth * 18 }}
        onClick={toggleDirectory}
        aria-expanded={isExpanded}
        aria-busy={loading}
      >
        <ChevronRight className={`tree-chevron ${isExpanded ? 'is-open' : ''}`} size={14} aria-hidden="true" />
        {isExpanded ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
        <span>{directory.name}{loading ? '…' : ''}</span>
      </button>
      {isExpanded ? (
        <div>{directory.children.map((child) => <TreeItem key={child.path} node={child} depth={depth + 1} activePath={activePath} query={query} expandedPaths={expandedPaths} onOpen={onOpen} onExpandDirectory={onExpandDirectory} onDirectoryExpandedChange={onDirectoryExpandedChange} />)}</div>
      ) : null}
    </div>
  )
}

export function FileTree({ nodes, activePath, query, language, expandedPaths, onOpen, onExpandDirectory, onDirectoryExpandedChange }: FileTreeProps) {
  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query])
  return (
    <nav className="file-tree" aria-label={translate(language, 'markdownFiles')}>
      {nodes.map((node) => <TreeItem key={node.path || node.name} node={node} depth={0} activePath={activePath} query={normalizedQuery} expandedPaths={expandedPaths} onOpen={onOpen} onExpandDirectory={onExpandDirectory} onDirectoryExpandedChange={onDirectoryExpandedChange} />)}
    </nav>
  )
}
