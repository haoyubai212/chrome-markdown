import { openDB } from 'idb'
import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const DB_NAME = 'local-md-reader'
const STORE_NAME = 'handles'
const ROOT_KEY = 'root-directory'
const SETTINGS_KEY = 'local-md-reader-settings-v1'
const LAST_PATH_KEY = 'local-md-reader-last-path'

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    },
  })
}

export async function saveRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await database()
  await db.put(STORE_NAME, handle, ROOT_KEY)
}

export async function getRootHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await database()
  return db.get(STORE_NAME, ROOT_KEY)
}

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadLastPath(): string {
  return localStorage.getItem(LAST_PATH_KEY) ?? ''
}

export function saveLastPath(path: string): void {
  localStorage.setItem(LAST_PATH_KEY, path)
}
