import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from '../src/lib/clipboard'

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: undefined })
})

describe('copyText', () => {
  it('copies the complete file URL with the Clipboard API', async () => {
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    await expect(copyText('file:///Users/test/brain-hub/wiki/MEMORY.md')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('file:///Users/test/brain-hub/wiki/MEMORY.md')
  })

  it('falls back to the active document when Clipboard API is unavailable', async () => {
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand })

    await expect(copyText('file:///Users/test/note.md')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })
})
