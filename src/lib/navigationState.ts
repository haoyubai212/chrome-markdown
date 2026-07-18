export type LocalNavigationState = {
  rootUrl: string
  targetUrl: string
  expandedPaths: string[]
}

type NavigationResponse = {
  ok: boolean
  state?: LocalNavigationState | null
  error?: string
}

export async function loadLocalNavigationState(): Promise<LocalNavigationState | null> {
  if (!globalThis.chrome?.runtime?.sendMessage) return null
  const response = await chrome.runtime.sendMessage({ type: 'LOAD_LOCAL_NAVIGATION_STATE' }) as NavigationResponse
  return response?.ok && response.state ? response.state : null
}

export async function saveLocalNavigationState(state: LocalNavigationState): Promise<void> {
  if (!globalThis.chrome?.runtime?.sendMessage) return
  const response = await chrome.runtime.sendMessage({
    type: 'SAVE_LOCAL_NAVIGATION_STATE',
    payload: state,
  }) as NavigationResponse
  if (!response?.ok) throw new Error(response?.error || 'Could not preserve folder state')
}
