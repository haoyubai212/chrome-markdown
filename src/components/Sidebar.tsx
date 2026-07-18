import { FileText, FolderTree, ListTree, Search, X } from 'lucide-react'
import { translate } from '../lib/i18n'
import type { Heading, Language, TreeNode } from '../types'
import { FileTree } from './FileTree'

type SidebarProps = {
  rootName: string
  tree: TreeNode[]
  activePath: string
  headings: Heading[]
  tab: 'files' | 'outline'
  query: string
  language: Language
  singleFileMode: boolean
  restoreFolderName?: string
  onTabChange: (tab: 'files' | 'outline') => void
  onQueryChange: (query: string) => void
  onOpen: (path: string) => void
  onExpandDirectory: (path: string, url: string) => Promise<void>
  onChooseFolder: () => void
  onRestoreFolder: () => void
}

export function Sidebar(props: SidebarProps) {
  const { rootName, tree, activePath, headings, tab, query, language, singleFileMode, restoreFolderName, onTabChange, onQueryChange, onOpen, onExpandDirectory, onChooseFolder, onRestoreFolder } = props
  const folderAction = restoreFolderName ? onRestoreFolder : onChooseFolder
  const folderActionLabel = restoreFolderName
    ? translate(language, 'restoreFolderShort', { name: restoreFolderName })
    : translate(language, singleFileMode ? 'loadContainingFolder' : 'switchFolder')
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="segmented" role="tablist" aria-label={translate(language, 'sidebarMode')}>
          <button className={tab === 'files' ? 'is-active' : ''} onClick={() => onTabChange('files')} role="tab" aria-selected={tab === 'files'}>
            <FolderTree size={16} aria-hidden="true" /> {translate(language, 'files')}
          </button>
          <button className={tab === 'outline' ? 'is-active' : ''} onClick={() => onTabChange('outline')} role="tab" aria-selected={tab === 'outline'}>
            <ListTree size={16} aria-hidden="true" /> {translate(language, 'outline')}
          </button>
        </div>
        {tab === 'files' ? (
          <label className="search-box">
            <Search size={15} aria-hidden="true" />
            <input id="file-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={translate(language, 'searchFiles')} aria-label={translate(language, 'searchFiles')} />
            {query ? <button onClick={() => onQueryChange('')} aria-label={translate(language, 'clearSearch')}><X size={14} /></button> : <kbd>⌘K</kbd>}
          </label>
        ) : null}
      </div>

      <div className="sidebar-content">
        {tab === 'files' ? (
          tree.length ? (
            <>
              <div className="root-label"><FolderTree size={15} /> <span>{rootName}</span></div>
              <FileTree nodes={tree} activePath={activePath} query={query} language={language} onOpen={onOpen} onExpandDirectory={onExpandDirectory} />
            </>
          ) : (
            <div className="sidebar-empty">
              <FileText size={28} />
              <p>{translate(language, 'folderIntro')}</p>
              <button className="primary-button" onClick={onChooseFolder}>{translate(language, 'openFolder')}</button>
            </div>
          )
        ) : (
          <nav className="outline-list" aria-label={translate(language, 'documentOutline')}>
            {headings.length ? headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`} style={{ paddingInlineStart: 12 + (heading.level - 1) * 14 }}>{heading.text}</a>
            )) : <p className="muted-message">{translate(language, 'noHeadings')}</p>}
          </nav>
        )}
      </div>
      <button className="change-folder" onClick={folderAction} title={folderActionLabel}><FolderTree size={16} /> {folderActionLabel}</button>
    </aside>
  )
}
