import { describe, expect, it } from 'vitest'
import { folderAccessActionForTab } from '../src/lib/folderAccess'

describe('single-file Files tab authorization', () => {
  it('opens the folder picker for a new project', () => {
    expect(folderAccessActionForTab('files', true, false)).toBe('choose')
  })

  it('requests access to a remembered project instead of choosing it again', () => {
    expect(folderAccessActionForTab('files', true, true)).toBe('restore')
  })

  it('does not request folder access while viewing the outline or an already loaded directory', () => {
    expect(folderAccessActionForTab('outline', true, false)).toBe('none')
    expect(folderAccessActionForTab('files', false, false)).toBe('none')
  })
})
