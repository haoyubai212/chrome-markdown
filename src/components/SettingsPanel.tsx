import { X } from 'lucide-react'
import type { Settings } from '../types'

type SettingsPanelProps = {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="settings-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header><h2 id="settings-title">阅读设置</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={18} /></button></header>
        <label>
          <span>主题</span>
          <select value={settings.theme} onChange={(event) => onChange({ ...settings, theme: event.target.value as Settings['theme'] })}>
            <option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option>
          </select>
        </label>
        <label>
          <span>正文字号 <output>{settings.fontSize}px</output></span>
          <input type="range" min="15" max="23" step="1" value={settings.fontSize} onChange={(event) => onChange({ ...settings, fontSize: Number(event.target.value) })} />
        </label>
        <label className="toggle-row"><span>自动刷新当前文件</span><input type="checkbox" checked={settings.autoRefresh} onChange={(event) => onChange({ ...settings, autoRefresh: event.target.checked })} /></label>
        <label className="toggle-row"><span>显示隐藏目录</span><input type="checkbox" checked={settings.showHidden} onChange={(event) => onChange({ ...settings, showHidden: event.target.checked })} /></label>
      </section>
    </div>
  )
}
