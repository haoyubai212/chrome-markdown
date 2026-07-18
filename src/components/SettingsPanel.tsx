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
        <div className="setting-field">
          <span>{translate(language, 'language')}</span>
          <div className="setting-segmented" role="group" aria-label={translate(language, 'language')}>
            {(['zh', 'en'] as const).map((value) => (
              <button key={value} type="button" className={settings.language === value ? 'is-active' : ''} aria-pressed={settings.language === value} onClick={() => onChange({ ...settings, language: value })}>
                {translate(language, value === 'zh' ? 'chinese' : 'english')}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-field">
          <span>{translate(language, 'theme')}</span>
          <div className="setting-segmented" role="group" aria-label={translate(language, 'theme')}>
            {(['light', 'dark'] as const).map((value) => (
              <button key={value} type="button" className={settings.theme === value ? 'is-active' : ''} aria-pressed={settings.theme === value} onClick={() => onChange({ ...settings, theme: value })}>
                {translate(language, value === 'light' ? 'lightTheme' : 'darkTheme')}
              </button>
            ))}
          </div>
        </div>
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
