export type Theme = 'light' | 'dark'
export type Language = 'zh' | 'en'

export type FileNode = {
  kind: 'file'
  name: string
  path: string
  handle?: FileSystemFileHandle
  url?: string
}

export type DirectoryNode = {
  kind: 'directory'
  name: string
  path: string
  handle?: FileSystemDirectoryHandle
  url?: string
  children: TreeNode[]
  loaded?: boolean
}

export type TreeNode = FileNode | DirectoryNode

export type LoadedDocument = {
  path: string
  name: string
  markdown: string
  lastModified: number
  fileHandle?: FileSystemFileHandle
  sourceUrl?: string
}

export type Heading = {
  id: string
  level: number
  text: string
}

export type Settings = {
  theme: Theme
  language: Language
  fontSize: number
  sidebarWidth: number
  showHidden: boolean
  autoRefresh: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'zh',
  fontSize: 18,
  sidebarWidth: 340,
  showHidden: false,
  autoRefresh: true,
}
