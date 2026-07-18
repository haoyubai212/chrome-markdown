import type { DirectoryNode, LoadedDocument, TreeNode } from '../types'
import { isMarkdownFile, shouldIncludeName } from './paths'

type PermissionCapableHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
  requestPermission?: (descriptor: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
}

export async function ensureReadPermission(handle: FileSystemDirectoryHandle, request = false): Promise<boolean> {
  const capable = handle as PermissionCapableHandle
  const descriptor: FileSystemHandlePermissionDescriptor = { mode: 'read' }
  const current = (await capable.queryPermission?.(descriptor)) ?? 'prompt'
  if (current === 'granted') return true
  if (!request) return false
  return (await capable.requestPermission?.(descriptor)) === 'granted'
}

export async function buildTree(
  handle: FileSystemDirectoryHandle,
  showHidden: boolean,
  parentPath = '',
): Promise<DirectoryNode> {
  const directory: DirectoryNode = {
    kind: 'directory',
    name: handle.name,
    path: parentPath,
    handle,
    children: [],
  }

  const childPromises: Promise<TreeNode | null>[] = []
  for await (const [name, childHandle] of handle.entries()) {
    if (!shouldIncludeName(name, showHidden)) continue
    const path = parentPath ? `${parentPath}/${name}` : name
    if (childHandle.kind === 'directory') {
      childPromises.push(buildTree(childHandle, showHidden, path))
    } else if (isMarkdownFile(name)) {
      childPromises.push(Promise.resolve({ kind: 'file', name, path, handle: childHandle }))
    }
  }

  const children = (await Promise.all(childPromises)).filter((node): node is TreeNode => node !== null)
  directory.children = children
    .filter((node) => node.kind === 'file' || node.children.length > 0)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })
  return directory
}

export async function readDocument(handle: FileSystemFileHandle, path: string): Promise<LoadedDocument> {
  const file = await handle.getFile()
  return {
    path,
    name: file.name,
    markdown: await file.text(),
    lastModified: file.lastModified,
    fileHandle: handle,
  }
}

export async function resolveFileHandle(
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle | null> {
  const parts = path.split('/').filter(Boolean)
  if (!parts.length) return null
  let directory = root
  try {
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part)
    return await directory.getFileHandle(parts.at(-1)!)
  } catch {
    return null
  }
}

export async function readAssetUrl(
  root: FileSystemDirectoryHandle,
  path: string,
  objectUrls: Set<string>,
): Promise<string | null> {
  const handle = await resolveFileHandle(root, path)
  if (!handle) return null
  const file = await handle.getFile()
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}
