import { describe, expect, it, vi } from 'vitest'
import { clearDocumentHash, scrollToHeading } from '../src/lib/documentNavigation'

describe('document navigation', () => {
  it('removes only the heading hash from the visible file URL', () => {
    const replaceState = vi.fn()
    const location = {
      href: 'file:///Users/test/AGENT.md#memory-rules',
      hash: '#memory-rules',
    } as Location
    const history = { state: { reader: true }, replaceState } as unknown as History

    expect(clearDocumentHash(location, history)).toBe(true)
    expect(replaceState).toHaveBeenCalledWith({ reader: true }, '', 'file:///Users/test/AGENT.md')
  })

  it('does not rewrite a file URL that has no hash', () => {
    const replaceState = vi.fn()
    const location = { href: 'file:///Users/test/AGENT.md', hash: '' } as Location
    const history = { state: null, replaceState } as unknown as History

    expect(clearDocumentHash(location, history)).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('scrolls to an outline heading without changing location', () => {
    const scrollIntoView = vi.fn()
    const sourceDocument = {
      getElementById: vi.fn(() => ({ scrollIntoView })),
    } as unknown as Document

    expect(scrollToHeading('memory-rules', sourceDocument)).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
