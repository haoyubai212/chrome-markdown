import { FileText, FolderTree, ListTree, Search, X } from 'lucide-react'
import type { Heading, TreeNode } from '../types'
import { FileTree } from './FileTree'

type SidebarProps = {
  rootName: string
  tree: TreeNode[]
  activePath: string
  headings: Heading[]
  tab: 'files' | 'outline'
  query: string
  onTabChange: (tab: 'files' | 'outline') => void
  onQueryChange: (query: string) => void
  onOpen: (path: string) => void
  onChooseFolder: () => void
}

export function Sidebar(props: SidebarProps) {
  const { rootName, tree, activePath, headings, tab, query, onTabChange, onQueryChange, onOpen, onChooseFolder } = props
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="segmented" role="tablist" aria-label="Sidebar mode">
          <button className={tab === 'files' ? 'is-active' : ''} onClick={() => onTabChange('files')} role="tab" aria-selected={tab === 'files'}>
            <FolderTree size={16} aria-hidden="true" /> 文件
          </button>
          <button className={tab === 'outline' ? 'is-active' : ''} onClick={() => onTabChange('outline')} role="tab" aria-selected={tab === 'outline'}>
            <ListTree size={16} aria-hidden="true" /> 大纲
          </button>
        </div>
        {tab === 'files' ? (
          <label className="search-box">
            <Search size={15} aria-hidden="true" />
            <input id="file-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索文件" aria-label="搜索文件" />
            {query ? <button onClick={() => onQueryChange('')} aria-label="清空搜索"><X size={14} /></button> : <kbd>⌘K</kbd>}
          </label>
        ) : null}
      </div>

      <div className="sidebar-content">
        {tab === 'files' ? (
          tree.length ? (
            <>
              <div className="root-label"><FolderTree size={15} /> <span>{rootName}</span></div>
              <FileTree nodes={tree} activePath={activePath} query={query} onOpen={onOpen} />
            </>
          ) : (
            <div className="sidebar-empty">
              <FileText size={28} />
              <p>选择一个文件夹，开始阅读其中的 Markdown 文档。</p>
              <button className="primary-button" onClick={onChooseFolder}>打开文件夹</button>
            </div>
          )
        ) : (
          <nav className="outline-list" aria-label="Document outline">
            {headings.length ? headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`} style={{ paddingInlineStart: 12 + (heading.level - 1) * 14 }}>{heading.text}</a>
            )) : <p className="muted-message">当前文档没有标题。</p>}
          </nav>
        )}
      </div>
      <button className="change-folder" onClick={onChooseFolder} title="切换文件夹"><FolderTree size={16} /> 切换文件夹</button>
    </aside>
  )
}
