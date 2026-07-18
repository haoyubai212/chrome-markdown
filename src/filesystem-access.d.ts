type FileSystemPermissionMode = 'read' | 'readwrite'

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode
}

interface FileSystemDirectoryHandle {
  readonly kind: 'directory'
  readonly name: string
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>
  isSameEntry(other: FileSystemHandle): Promise<boolean>
}

interface Window {
  showDirectoryPicker(options?: { mode?: FileSystemPermissionMode; id?: string }): Promise<FileSystemDirectoryHandle>
}
