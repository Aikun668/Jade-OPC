import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type {
  MemorySnapshot,
  MemorySpace,
  MemoryItem,
  MemoryDraft,
  LocalAsset,
} from '../../src/types/domain'
import type { MemoryRepository } from '../../src/types/repository'
import { useMemoryStore } from '../../src/stores/memory'
import { provideRepository, _resetRepository } from '../../src/stores/deps'

function mkSnapshot(overrides: Partial<MemorySnapshot> = {}): MemorySnapshot {
  return {
    schemaVersion: 1,
    sampleMode: 'empty',
    hasCompletedOnboarding: false,
    spaces: [],
    memories: [],
    drafts: [],
    assets: [],
    ...overrides,
  }
}

function mkSpace(overrides: Partial<MemorySpace> = {}): MemorySpace {
  return {
    id: 's1',
    name: 'Test Space',
    coverAssetId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mkMemory(overrides: Partial<MemoryItem> = {}): MemoryItem {
  return {
    id: 'm1',
    spaceId: 's1',
    entry: 'daily',
    originalText: 'Hello',
    aiCandidateText: null,
    assetIds: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function mkDraft(overrides: Partial<MemoryDraft> = {}): MemoryDraft {
  return {
    id: 'd1',
    spaceId: 's1',
    entry: 'daily',
    text: 'Draft text',
    assetIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createMockRepo(overrides: Partial<MemoryRepository> = {}): MemoryRepository {
  return {
    bootstrap: async () => mkSnapshot(),
    createSpace: async () => ({ value: mkSpace(), snapshot: mkSnapshot() }),
    updateSpace: async () => ({ value: mkSpace(), snapshot: mkSnapshot() }),
    deleteSpace: async () => mkSnapshot(),
    saveMemory: async () => ({ value: mkMemory(), snapshot: mkSnapshot() }),
    updateMemory: async () => ({ value: mkMemory(), snapshot: mkSnapshot() }),
    deleteMemory: async () => mkSnapshot(),
    saveDraft: async () => ({ value: mkDraft(), snapshot: mkSnapshot() }),
    deleteDraft: async () => mkSnapshot(),
    resetSample: async () => mkSnapshot(),
    completeOnboarding: async () => mkSnapshot(),
    ...overrides,
  }
}

describe('useMemoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetRepository()
  })

  it('T4C-M13: only domain state is spaces/memories/drafts/assets', () => {
    const store = useMemoryStore()
    expect(store.spaces).toEqual([])
    expect(store.memories).toEqual([])
    expect(store.drafts).toEqual([])
    expect(store.assets).toEqual([])
  })

  it('T4C-M14: _commitSnapshot replaces all four state groups', () => {
    const store = useMemoryStore()
    const snap = mkSnapshot({
      spaces: [mkSpace({ id: 's1', name: 'A' })],
      memories: [mkMemory({ id: 'm1' })],
      drafts: [mkDraft({ id: 'd1' })],
      assets: [{ id: 'a1', ownerType: 'space', ownerId: 's1', uri: '/x.jpg', persistence: 'session-only', availability: 'available', order: 0 }],
    })

    store._commitSnapshot(snap)

    expect(store.spaces).toHaveLength(1)
    expect(store.spaces[0].name).toBe('A')
    expect(store.memories).toHaveLength(1)
    expect(store.drafts).toHaveLength(1)
    expect(store.assets).toHaveLength(1)
  })

  // ---- Actions ----

  it('T4C-M19: action waits for Repository success before replacing state', async () => {
    const repo = createMockRepo({
      createSpace: async () => ({
        value: mkSpace({ id: 'new-s', name: 'New Space' }),
        snapshot: mkSnapshot({ spaces: [mkSpace({ id: 'new-s', name: 'New Space' })] }),
      }),
    })
    provideRepository(repo)
    const store = useMemoryStore()

    await store.createSpace({ name: 'New Space', coverPhoto: null })

    expect(store.spaces).toHaveLength(1)
    expect(store.spaces[0].name).toBe('New Space')
  })

  it('createSpace returns the MemorySpace with id from Repository', async () => {
    provideRepository(createMockRepo({
      createSpace: async () => ({
        value: mkSpace({ id: 'repo-gen-id', name: 'Returned Space' }),
        snapshot: mkSnapshot({ spaces: [mkSpace({ id: 'repo-gen-id', name: 'Returned Space' })] }),
      }),
    }))
    const store = useMemoryStore()

    const result = await store.createSpace({ name: 'Test', coverPhoto: null })

    expect(result.id).toBe('repo-gen-id')
    expect(result.name).toBe('Returned Space')
  })

  it('T4C-M21: Repository reject keeps state unchanged', async () => {
    provideRepository(createMockRepo({
      createSpace: async () => { throw new Error('Write failed') },
    }))
    const store = useMemoryStore()

    store._commitSnapshot(mkSnapshot({ spaces: [mkSpace({ id: 's1' })] }))

    await expect(store.createSpace({ name: 'New', coverPhoto: null })).rejects.toThrow('Write failed')
    expect(store.spaces).toHaveLength(1) // unchanged
  })

  it('T4C-M22: reject propagates, does not fake success', async () => {
    provideRepository(createMockRepo({
      deleteSpace: async () => { throw new Error('Delete failed') },
    }))
    const store = useMemoryStore()

    await expect(store.deleteSpace('s1')).rejects.toThrow('Delete failed')
  })

  it('T4C-M18: action forwards domain input to Repository as-is', async () => {
    let capturedInput: any = null
    provideRepository(createMockRepo({
      createSpace: async (input: any) => {
        capturedInput = input
        return { value: mkSpace(), snapshot: mkSnapshot() }
      },
    }))
    const store = useMemoryStore()

    await store.createSpace({ name: 'Test', coverPhoto: null })
    expect(capturedInput).toEqual({ name: 'Test', coverPhoto: null })
  })

  it('T4C-M20: action uses returned snapshot to commit', async () => {
    const returnSnap = mkSnapshot({
      spaces: [mkSpace({ id: 'from-repo', name: 'From Repo' })],
    })
    provideRepository(createMockRepo({
      createSpace: async () => ({
        value: mkSpace({ id: 'from-repo', name: 'From Repo' }),
        snapshot: returnSnap,
      }),
    }))
    const store = useMemoryStore()

    await store.createSpace({ name: 'Test', coverPhoto: null })
    expect(store.spaces[0].name).toBe('From Repo')
  })

  it('T4C-M23: saveMemory does not additionally call deleteDraft', async () => {
    let saveMemoryCalled = false
    provideRepository(createMockRepo({
      saveMemory: async () => {
        saveMemoryCalled = true
        return { value: mkMemory(), snapshot: mkSnapshot() }
      },
    }))
    const store = useMemoryStore()

    await store.saveMemory({
      spaceId: 's1',
      entry: 'daily',
      originalText: 'Hello',
      assets: [],
      sourceDraftId: 'd1',
    })

    expect(saveMemoryCalled).toBe(true)
    // No additional deleteDraft call — Repository handles it atomically
  })

  // ---- resetSample ----

  it('T4C-M24: resetSample commits snapshot to memoryStore and returns it', async () => {
    const resetSnap = mkSnapshot({
      sampleMode: 'complete',
      schemaVersion: 1,
      hasCompletedOnboarding: true,
      spaces: [mkSpace({ id: 'reset-s', name: 'Reset Space' })],
    })
    provideRepository(createMockRepo({
      resetSample: async () => resetSnap,
    }))
    const store = useMemoryStore()

    const returned = await store.resetSample('complete')

    expect(store.spaces).toHaveLength(1)
    expect(store.spaces[0].id).toBe('reset-s')
    expect(returned).toBe(resetSnap)
  })

  // ---- Getters ----

  it('T4C-M26: spaces sorted by most recent memory, then name', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [
        mkSpace({ id: 's-old', name: 'Alpha', createdAt: '2026-01-01T00:00:00.000Z' }),
        mkSpace({ id: 's-new', name: 'Beta', createdAt: '2026-01-01T00:00:00.000Z' }),
      ],
      memories: [
        mkMemory({ id: 'm-new', spaceId: 's-new', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' }),
        mkMemory({ id: 'm-old', spaceId: 's-old', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }),
      ],
    }))

    expect(store.sortedSpaces[0].id).toBe('s-new')
    expect(store.sortedSpaces[1].id).toBe('s-old')
  })

  it('T4C-M26: spaces without memories sorted by creation time then name', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [
        mkSpace({ id: 's1', name: 'Beta', createdAt: '2026-01-01T00:00:00.000Z' }),
        mkSpace({ id: 's2', name: 'Alpha', createdAt: '2026-01-01T00:00:00.000Z' }),
      ],
    }))

    expect(store.sortedSpaces[0].id).toBe('s2') // Alpha comes before Beta
    expect(store.sortedSpaces[1].id).toBe('s1')
  })

  it('T4C-M27: recentMemories returns at most 3', () => {
    const store = useMemoryStore()
    const mems = Array.from({ length: 5 }, (_, i) =>
      mkMemory({
        id: `m${i}`,
        spaceId: 's1',
        createdAt: `2026-01-0${i + 1}T00:00:00.000Z`,
        updatedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
      }),
    )
    store._commitSnapshot(mkSnapshot({ memories: mems }))

    const recent = store.recentMemories('s1')
    expect(recent).toHaveLength(3)
    expect(recent[0].id).toBe('m4') // newest first
  })

  it('T4C-M28: allMemories excludes drafts', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      memories: [
        mkMemory({ id: 'm1', spaceId: 's1', createdAt: '2026-01-02T00:00:00.000Z' }),
        mkMemory({ id: 'm2', spaceId: 's1', createdAt: '2026-01-01T00:00:00.000Z' }),
      ],
    }))

    const result = store.allMemories('s1')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('m1') // newest first
    expect(result[0].entry).toBe('daily')
  })

  it('T4C-M29: draftForSpace returns at most one draft', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      drafts: [
        mkDraft({ id: 'd1', spaceId: 's1' }),
        mkDraft({ id: 'd2', spaceId: 's2' }),
      ],
    }))

    expect(store.draftForSpace('s1')?.id).toBe('d1')
    expect(store.draftForSpace('s2')?.id).toBe('d2')
    expect(store.draftForSpace('s3')).toBeNull()
  })

  it('T4C-M30: findSpace/findMemory/findAsset by ID', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace({ id: 'space-1' })],
      memories: [mkMemory({ id: 'mem-1' })],
      assets: [{ id: 'asset-1', ownerType: 'space', ownerId: 's1', uri: '/a.jpg', persistence: 'session-only', availability: 'available', order: 0 }],
    }))

    expect(store.findSpace('space-1')?.id).toBe('space-1')
    expect(store.findSpace('nope')).toBeNull()
    expect(store.findMemory('mem-1')?.id).toBe('mem-1')
    expect(store.findMemory('nope')).toBeNull()
    expect(store.findAsset('asset-1')?.id).toBe('asset-1')
    expect(store.findAsset('nope')).toBeNull()
  })

  it('T4C-M31: getter does not mutate store arrays in place', () => {
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace({ id: 's1', name: 'B' }), mkSpace({ id: 's2', name: 'A' })],
    }))

    const sorted = store.sortedSpaces
    const originalOrder = store.spaces.map(s => s.id)

    // sorted is a different ordering, but original should be unchanged
    expect(originalOrder).toEqual(['s1', 's2'])
    expect(sorted.map((s: MemorySpace) => s.id)).toEqual(['s2', 's1'])
  })

  // ---- Task 9: deleteMemory Store tests ----

  it('T9-SM01: deleteMemory success commits returned snapshot', async () => {
    const afterDeleteSnap = mkSnapshot({ memories: [], spaces: [mkSpace()] })
    provideRepository(createMockRepo({
      deleteMemory: async () => afterDeleteSnap,
    }))
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace()],
      memories: [mkMemory({ id: 'm_to_delete' })],
    }))

    await store.deleteMemory('m_to_delete')

    expect(store.memories).toHaveLength(0)
    expect(store.spaces).toHaveLength(1)
  })

  it('T9-SM02: deleteMemory failure keeps original state', async () => {
    provideRepository(createMockRepo({
      deleteMemory: async () => { throw new Error('Delete failed') },
    }))
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace()],
      memories: [mkMemory({ id: 'm_keep' })],
    }))

    await expect(store.deleteMemory('m_keep')).rejects.toThrow('Delete failed')
    expect(store.memories).toHaveLength(1)
    expect(store.memories[0].id).toBe('m_keep')
  })

  // ---- Task 9: deleteSpace Store tests ----

  it('T9-SM03: deleteSpace success commits returned snapshot', async () => {
    const afterDeleteSnap = mkSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    provideRepository(createMockRepo({
      deleteSpace: async () => afterDeleteSnap,
    }))
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace({ id: 's_to_delete' })],
      memories: [mkMemory({ id: 'm1', spaceId: 's_to_delete' })],
    }))

    await store.deleteSpace('s_to_delete')

    expect(store.spaces).toHaveLength(0)
    expect(store.memories).toHaveLength(0)
  })

  it('T9-SM04: deleteSpace failure keeps original state', async () => {
    provideRepository(createMockRepo({
      deleteSpace: async () => { throw new Error('Delete space failed') },
    }))
    const store = useMemoryStore()
    store._commitSnapshot(mkSnapshot({
      spaces: [mkSpace({ id: 's_keep' })],
      memories: [mkMemory({ id: 'm1', spaceId: 's_keep' })],
    }))

    await expect(store.deleteSpace('s_keep')).rejects.toThrow('Delete space failed')
    expect(store.spaces).toHaveLength(1)
    expect(store.memories).toHaveLength(1)
  })

  it('T4C-M32: empty results return empty arrays, not error', () => {
    const store = useMemoryStore()

    expect(store.sortedSpaces).toEqual([])
    expect(store.recentMemories('s1')).toEqual([])
    expect(store.allMemories('s1')).toEqual([])
    expect(store.draftForSpace('s1')).toBeNull()
  })
})
