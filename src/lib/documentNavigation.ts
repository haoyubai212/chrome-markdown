type LocationLike = Pick<Location, 'href' | 'hash'>
type HistoryLike = Pick<History, 'state' | 'replaceState'>

export function clearDocumentHash(
  sourceLocation: LocationLike = window.location,
  sourceHistory: HistoryLike = window.history,
): boolean {
  if (!sourceLocation.hash) return false
  const cleanUrl = new URL(sourceLocation.href)
  cleanUrl.hash = ''
  sourceHistory.replaceState(sourceHistory.state, '', cleanUrl.href)
  return true
}

export function scrollToHeading(headingId: string, sourceDocument: Document = document): boolean {
  const heading = sourceDocument.getElementById(headingId)
  if (!heading) return false
  heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}
