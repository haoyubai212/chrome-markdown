import { Moon, RefreshCw, Settings as SettingsIcon, Sun } from 'lucide-react'
import { translate } from '../lib/i18n'
import type { Language, Theme } from '../types'

type TopBarProps = {
  rootName: string
  path: string
  theme: Theme
  language: Language
  loading: boolean
  onThemeToggle: () => void
  onRefresh: () => void
  onSettings: () => void
}

export function TopBar({ rootName, path, theme, language, loading, onThemeToggle, onRefresh, onSettings }: TopBarProps) {
  const crumbs = path.split('/').filter(Boolean)
  return (
    <header className="topbar">
      <div className="breadcrumbs" title={path}>
        <span>{rootName || 'Local MD Reader'}</span>
        {crumbs.map((crumb) => <span key={`${path}-${crumb}`} className="crumb">{crumb}</span>)}
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
