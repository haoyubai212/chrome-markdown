import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadLocalNavigationState, saveLocalNavigationState } from '../src/lib/navigationState'

afterEach(() => vi.unstubAllGlobals())

describe('local navigation state bridge', () => {
  it('loads the state saved for the current tab', async () => {
    const state = {
      rootUrl: 'file:///Users/test/project/',
      targetUrl: 'file:///Users/test/project/docs/plan.md',
      expandedPaths: ['docs'],
    }
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, state })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })
    await expect(loadLocalNavigationState()).resolves.toEqual(state)
    expect(sendMessage).toHaveBeenCalledWith({ type: 'LOAD_LOCAL_NAVIGATION_STATE' })
  })

  it('saves only navigation metadata before leaving the page', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })
    const state = {
      rootUrl: 'file:///Users/test/project/',
      targetUrl: 'file:///Users/test/project/docs/plan.md',
      expandedPaths: ['docs'],
    }
    await saveLocalNavigationState(state)
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'SAVE_LOCAL_NAVIGATION_STATE',
      payload: state,
    })
  })
})
