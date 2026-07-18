import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SettingsPanel } from '../src/components/SettingsPanel'
import { DEFAULT_SETTINGS } from '../src/types'

describe('Settings panel', () => {
  it('uses two-option buttons for language and theme', () => {
    const html = renderToStaticMarkup(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={() => undefined} onClose={() => undefined} />)
    expect(html).not.toContain('<select')
    expect(html.match(/role="group"/g)).toHaveLength(2)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('浅色')
    expect(html).toContain('深色')
  })
})
