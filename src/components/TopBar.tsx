import { CheckCircle2, Moon, RefreshCw, Settings as SettingsIcon, Sun } from 'lucide-react'
import type { Theme } from '../types'

type TopBarProps = {
  rootName: string
  path: string
  theme: Theme
  loading: boolean
  onThemeToggle: () => void
  onRefresh: () => void
  onSettings: () => void
}

export function TopBar({ rootName, path, theme, loading, onThemeToggle, onRefresh, onSettings }: TopBarProps) {
  const crumbs = path.split('/').filter(Boolean)
  return (
    <header className="topbar">
      <div className="breadcrumbs" title={path}>
        <span>{rootName || 'Local MD Reader'}</span>
        {crumbs.map((crumb) => <span key={`${path}-${crumb}`} className="crumb">{crumb}</span>)}
      </div>
      <div className="topbar-actions">
        <span className="local-badge"><CheckCircle2 size={14} /> 完全本地</span>
        <button className="icon-button" onClick={onThemeToggle} title="切换主题" aria-label="切换主题">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button" onClick={onRefresh} title="重新读取" aria-label="重新读取">
          <RefreshCw className={loading ? 'is-spinning' : ''} size={18} />
        </button>
        <button className="icon-button" onClick={onSettings} title="阅读设置" aria-label="阅读设置"><SettingsIcon size={18} /></button>
      </div>
    </header>
  )
}
