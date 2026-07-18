import { describe, expect, it, vi } from 'vitest'
import { translate } from '../src/lib/i18n'
import { loadSettings } from '../src/lib/storage'

describe('interface language', () => {
  it('translates interface labels and interpolates values', () => {
    expect(translate('zh', 'outline')).toBe('大纲')
    expect(translate('en', 'outline')).toBe('Outline')
    expect(translate('en', 'restoreFolder', { name: 'docs' })).toBe('Restore access to “docs”')
    expect(translate('zh', 'restoreFolderPersistent', { name: 'brain-hub' })).toContain('每次访问都允许')
  })

  it('migrates existing settings to the default Chinese interface', () => {
    const values = new Map([['local-md-reader-settings-v1', JSON.stringify({ theme: 'dark', fontSize: 20 })]])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
    expect(loadSettings()).toMatchObject({ language: 'zh', theme: 'dark', fontSize: 20 })
    vi.unstubAllGlobals()
  })

  it('migrates the retired system theme to light', () => {
    const values = new Map([['local-md-reader-settings-v1', JSON.stringify({ theme: 'system', language: 'en' })]])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
    expect(loadSettings()).toMatchObject({ language: 'en', theme: 'light' })
    vi.unstubAllGlobals()
  })
})
