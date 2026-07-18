type FileSystemPermissionMode = 'read' | 'readwrite'

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>
}

interface Window {
  showDirectoryPicker(options?: { mode?: FileSystemPermissionMode; id?: string }): Promise<FileSystemDirectoryHandle>
}
