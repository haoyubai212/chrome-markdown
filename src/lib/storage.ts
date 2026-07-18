import { openDB } from 'idb'
import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const DB_NAME = 'local-md-reader'
const STORE_NAME = 'handles'
const ROOT_KEY = 'root-directory'
const ROOTS_KEY = 'root-directories-v2'
const MAX_ROOT_HANDLES = 20
const SETTINGS_KEY = 'local-md-reader-settings-v1'
const LAST_PATH_KEY = 'local-md-reader-last-path'

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    },
  })
}

function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
  return Boolean(value && typeof value === 'object' && (value as FileSystemDirectoryHandle).kind === 'directory' && typeof (value as FileSystemDirectoryHandle).name === 'string')
}

export async function mergeRootHandles(handles: FileSystemDirectoryHandle[], next: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle[]> {
  const unique: FileSystemDirectoryHandle[] = [next]
  for (const handle of handles) {
    let same = handle === next
    try { same = same || await next.isSameEntry(handle) } catch { /* stale handles remain independently restorable */ }
    if (!same) unique.push(handle)
    if (unique.length >= MAX_ROOT_HANDLES) break
  }
  return unique
}

export async function getRootHandles(): Promise<FileSystemDirectoryHandle[]> {
  const db = await database()
  const stored = await db.get(STORE_NAME, ROOTS_KEY) as unknown
  let handles = Array.isArray(stored) ? stored.filter(isDirectoryHandle) : []
  if (handles.length) return handles
  const legacy = await db.get(STORE_NAME, ROOT_KEY) as unknown
  if (isDirectoryHandle(legacy)) {
    handles = [legacy]
    await db.put(STORE_NAME, handles, ROOTS_KEY)
  }
  return handles
}

export async function saveRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const handles = await getRootHandles()
  const db = await database()
  await db.put(STORE_NAME, await mergeRootHandles(handles, handle), ROOTS_KEY)
}

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...saved, theme: saved.theme === 'dark' ? 'dark' : 'light' }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function normalizeSettings(saved: Partial<Settings>): Settings {
  return { ...DEFAULT_SETTINGS, ...saved, theme: saved.theme === 'dark' ? 'dark' : 'light' }
}

export async function loadPersistedSettings(): Promise<Settings> {
  try {
    if (globalThis.chrome?.storage?.local) {
      const stored = await chrome.storage.local.get(SETTINGS_KEY)
      const saved = stored[SETTINGS_KEY]
      if (saved && typeof saved === 'object') return normalizeSettings(saved as Partial<Settings>)
    }
  } catch { /* fall back to the extension page's localStorage */ }
  return loadSettings()
}

export function saveSettings(settings: Settings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* file pages may deny localStorage */ }
  if (globalThis.chrome?.storage?.local) void chrome.storage.local.set({ [SETTINGS_KEY]: settings })
}

export function loadLastPath(): string {
  return localStorage.getItem(LAST_PATH_KEY) ?? ''
}

export function saveLastPath(path: string): void {
  localStorage.setItem(LAST_PATH_KEY, path)
}
