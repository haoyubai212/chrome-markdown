export type FolderAccessAction = 'none' | 'restore' | 'choose'

export function folderAccessActionForTab(
  nextTab: 'files' | 'outline',
  singleFileMode: boolean,
  hasRememberedFolder: boolean,
): FolderAccessAction {
  if (nextTab !== 'files' || !singleFileMode) return 'none'
  return hasRememberedFolder ? 'restore' : 'choose'
}
