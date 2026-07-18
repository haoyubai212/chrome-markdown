import { useMemo, useState } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import type { TreeNode } from '../types'

type FileTreeProps = {
  nodes: TreeNode[]
  activePath: string
  query: string
  onOpen: (path: string) => void
}

function containsMatch(node: TreeNode, query: string): boolean {
  if (!query) return true
  if (node.name.toLowerCase().includes(query)) return true
  return node.kind === 'directory' && node.children.some((child) => containsMatch(child, query))
}

function TreeItem({ node, depth, activePath, query, onOpen }: {
  node: TreeNode
  depth: number
  activePath: string
  query: string
  onOpen: (path: string) => void
}) {
  const matches = containsMatch(node, query)
  const [expanded, setExpanded] = useState(depth < 1)
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

  const isExpanded = query ? true : expanded
  return (
    <div className="tree-directory">
      <button
        className="tree-row"
        style={{ paddingInlineStart: 8 + depth * 18 }}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={isExpanded}
      >
        <ChevronRight className={`tree-chevron ${isExpanded ? 'is-open' : ''}`} size={14} aria-hidden="true" />
        {isExpanded ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
        <span>{node.name}</span>
      </button>
      {isExpanded ? (
        <div>{node.children.map((child) => <TreeItem key={child.path} node={child} depth={depth + 1} activePath={activePath} query={query} onOpen={onOpen} />)}</div>
      ) : null}
    </div>
  )
}

export function FileTree({ nodes, activePath, query, onOpen }: FileTreeProps) {
  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query])
  return (
    <nav className="file-tree" aria-label="Markdown files">
      {nodes.map((node) => <TreeItem key={node.path || node.name} node={node} depth={0} activePath={activePath} query={normalizedQuery} onOpen={onOpen} />)}
    </nav>
  )
}
