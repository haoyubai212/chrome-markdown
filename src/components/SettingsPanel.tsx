import { X } from 'lucide-react'
import { translate } from '../lib/i18n'
import type { Settings } from '../types'

type SettingsPanelProps = {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const language = settings.language
  return (
    <div className="settings-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header><h2 id="settings-title">{translate(language, 'readingSettings')}</h2><button className="icon-button" onClick={onClose} aria-label={translate(language, 'close')}><X size={18} /></button></header>
        <label>
          <span>{translate(language, 'language')}</span>
          <select value={settings.language} onChange={(event) => onChange({ ...settings, language: event.target.value as Settings['language'] })}>
            <option value="zh">{translate(language, 'chinese')}</option><option value="en">{translate(language, 'english')}</option>
          </select>
        </label>
        <label>
          <span>{translate(language, 'theme')}</span>
          <select value={settings.theme} onChange={(event) => onChange({ ...settings, theme: event.target.value as Settings['theme'] })}>
            <option value="system">{translate(language, 'systemTheme')}</option><option value="light">{translate(language, 'lightTheme')}</option><option value="dark">{translate(language, 'darkTheme')}</option>
          </select>
        </label>
        <label>
          <span>{translate(language, 'fontSize')} <output>{settings.fontSize}px</output></span>
          <input type="range" min="15" max="23" step="1" value={settings.fontSize} onChange={(event) => onChange({ ...settings, fontSize: Number(event.target.value) })} />
        </label>
        <label className="toggle-row"><span>{translate(language, 'autoRefresh')}</span><input type="checkbox" checked={settings.autoRefresh} onChange={(event) => onChange({ ...settings, autoRefresh: event.target.checked })} /></label>
        <label className="toggle-row"><span>{translate(language, 'showHidden')}</span><input type="checkbox" checked={settings.showHidden} onChange={(event) => onChange({ ...settings, showHidden: event.target.checked })} /></label>
      </section>
    </div>
  )
}
