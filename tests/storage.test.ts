import { describe, expect, it, vi } from 'vitest'
import { mergeRootHandles } from '../src/lib/storage'

function directory(name: string, id = name): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name,
    isSameEntry: vi.fn(async (other: FileSystemHandle) => (other as FileSystemDirectoryHandle & { id?: string }).id === id),
    id,
  } as unknown as FileSystemDirectoryHandle & { id: string }
}

describe('remembered directories', () => {
  it('moves an existing directory to the front without duplicating it', async () => {
    const brainHub = directory('brain-hub', 'brain')
    const blublu = directory('BluBlu_AI', 'blublu')
    const reopenedBrainHub = directory('brain-hub', 'brain')
    const merged = await mergeRootHandles([blublu, brainHub], reopenedBrainHub)
    expect(merged.map((handle) => handle.name)).toEqual(['brain-hub', 'BluBlu_AI'])
  })

  it('keeps different directories that share the same display name', async () => {
    const firstDocs = directory('docs', 'one')
    const secondDocs = directory('docs', 'two')
    const merged = await mergeRootHandles([firstDocs], secondDocs)
    expect(merged).toHaveLength(2)
  })

  it('caps remembered directories at twenty most-recent entries', async () => {
    const existing = Array.from({ length: 24 }, (_, index) => directory(`project-${index}`))
    const merged = await mergeRootHandles(existing, directory('current'))
    expect(merged).toHaveLength(20)
    expect(merged[0].name).toBe('current')
  })
})
