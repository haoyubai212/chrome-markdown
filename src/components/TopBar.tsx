import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Moon, RefreshCw, Settings as SettingsIcon, Sun } from 'lucide-react'
import { copyText } from '../lib/clipboard'
import { translate } from '../lib/i18n'
import type { Language, Theme } from '../types'

type TopBarProps = {
  rootName: string
  path: string
  sourceUrl?: string
  theme: Theme
  language: Language
  loading: boolean
  onThemeToggle: () => void
  onRefresh: () => void
  onSettings: () => void
}

export function TopBar({ rootName, path, sourceUrl, theme, language, loading, onThemeToggle, onRefresh, onSettings }: TopBarProps) {
  const crumbs = path.split('/').filter(Boolean)
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyCurrentFileAddress() {
    if (!sourceUrl || !await copyText(sourceUrl)) return
    setCopied(true)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  const copyLabel = translate(language, copied ? 'fileAddressCopied' : 'copyFileAddress')
  return (
    <header className="topbar">
      <div className="topbar-location">
        <div className="breadcrumbs" title={sourceUrl || path}>
          <span>{rootName || 'Chrome Markdown'}</span>
          {crumbs.map((crumb) => <span key={`${path}-${crumb}`} className="crumb">{crumb}</span>)}
        </div>
        {sourceUrl ? (
          <button className={`copy-address-button${copied ? ' is-copied' : ''}`} type="button" onClick={copyCurrentFileAddress} title={copyLabel} aria-label={copyLabel}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        ) : null}
      </div>
      <div className="topbar-actions">
        <button className="icon-button" onClick={onThemeToggle} title={translate(language, 'switchTheme')} aria-label={translate(language, 'switchTheme')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button" onClick={onRefresh} title={translate(language, 'refresh')} aria-label={translate(language, 'refresh')}>
          <RefreshCw className={loading ? 'is-spinning' : ''} size={18} />
        </button>
        <button className="icon-button" onClick={onSettings} title={translate(language, 'readingSettings')} aria-label={translate(language, 'readingSettings')}><SettingsIcon size={18} /></button>
      </div>
    </header>
  )
}
