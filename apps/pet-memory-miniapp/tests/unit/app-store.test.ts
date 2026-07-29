import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { MemorySnapshot } from '../../src/types/domain'
import type { MemoryRepository } from '../../src/types/repository'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideRepository, _resetRepository } from '../../src/stores/deps'

function emptySnapshot(): MemorySnapshot {
  return {
    schemaVersion: 1,
    sampleMode: 'empty',
    hasCompletedOnboarding: false,
    spaces: [],
    memories: [],
    drafts: [],
    assets: [],
  }
}

function createMockRepo(overrides: Partial<MemoryRepository> = {}): MemoryRepository {
  return {
    bootstrap: async () => emptySnapshot(),
    createSpace: async () => ({ value: {} as any, snapshot: emptySnapshot() }),
    updateSpace: async () => ({ value: {} as any, snapshot: emptySnapshot() }),
    deleteSpace: async () => emptySnapshot(),
    saveMemory: async () => ({ value: {} as any, snapshot: emptySnapshot() }),
    updateMemory: async () => ({ value: {} as any, snapshot: emptySnapshot() }),
    deleteMemory: async () => emptySnapshot(),
    saveDraft: async () => ({ value: {} as any, snapshot: emptySnapshot() }),
    deleteDraft: async () => emptySnapshot(),
    resetSample: async () => emptySnapshot(),
    completeOnboarding: async () => emptySnapshot(),
    ...overrides,
  }
}

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetRepository()
    useMemoryStore()._reset()
  })

  it('T4C-M06: initial status is idle', () => {
    const store = useAppStore()
    expect(store.bootstrapStatus).toBe('idle')
  })

  it('T4C-M07: does not contain spaces/memories/drafts/assets', () => {
    const store = useAppStore()
    expect((store as any).spaces).toBeUndefined()
    expect((store as any).memories).toBeUndefined()
    expect((store as any).drafts).toBeUndefined()
    expect((store as any).assets).toBeUndefined()
  })

  it('T4C-M09: transitions idle → loading → ready on success', async () => {
    provideRepository(createMockRepo())
    const store = useAppStore()
    expect(store.bootstrapStatus).toBe('idle')

    const promise = store.bootstrap()
    expect(store.bootstrapStatus).toBe('loading')

    await promise
    expect(store.bootstrapStatus).toBe('ready')
  })

  it('T4C-M11: sampleMode and schemaVersion from successful snapshot', async () => {
    provideRepository(createMockRepo({
      bootstrap: async () => ({
        ...emptySnapshot(),
        sampleMode: 'complete',
        schemaVersion: 1,
      }),
    }))
    const store = useAppStore()
    await store.bootstrap()

    expect(store.sampleMode).toBe('complete')
    expect(store.schemaVersion).toBe(1)
  })

  it('T4C-M38: bootstrap reject enters error, not fake empty sample', async () => {
    provideRepository(createMockRepo({
      bootstrap: async () => { throw new Error('Bootstrap failed') },
    }))
    const store = useAppStore()

    await store.bootstrap()

    expect(store.bootstrapStatus).toBe('error')
    expect(store.initError).toContain('Bootstrap failed')
    expect(store.sampleMode).toBe('empty') // stays at default, not from snapshot
  })

  it('T4C-M10: init error is user-understandable', async () => {
    provideRepository(createMockRepo({
      bootstrap: async () => { throw new Error('Some failure') },
    }))
    const store = useAppStore()
    await store.bootstrap()

    expect(store.initError).toBe('Some failure')
  })

  it('T4C-M35: only one effective bootstrap per app launch', async () => {
    let callCount = 0
    provideRepository(createMockRepo({
      bootstrap: async () => {
        callCount++
        return emptySnapshot()
      },
    }))
    const store = useAppStore()

    await store.bootstrap()
    expect(callCount).toBe(1)

    await store.bootstrap()
    expect(callCount).toBe(1) // second call is no-op
  })

  it('T4C-M41: repeated lifecycle events do not trigger concurrent duplicate bootstrap', async () => {
    let callCount = 0
    provideRepository(createMockRepo({
      bootstrap: async () => {
        callCount++
        return emptySnapshot()
      },
    }))
    const store = useAppStore()

    // Fire multiple bootstrap calls concurrently
    await Promise.all([store.bootstrap(), store.bootstrap(), store.bootstrap()])
    expect(callCount).toBe(1)
  })

  it('T4C-M12: devMode can be toggled', () => {
    const store = useAppStore()
    expect(store.devMode).toBe(false)

    store.setDevMode(true)
    expect(store.devMode).toBe(true)

    store.setDevMode(false)
    expect(store.devMode).toBe(false)
  })

  it('T4C-M39: error preserves retry path', async () => {
    let shouldFail = true
    provideRepository(createMockRepo({
      bootstrap: async () => {
        if (shouldFail) throw new Error('First attempt fails')
        return emptySnapshot()
      },
    }))
    const store = useAppStore()

    await store.bootstrap()
    expect(store.bootstrapStatus).toBe('error')

    // Reset and retry
    store._reset()
    shouldFail = false
    await store.bootstrap()
    expect(store.bootstrapStatus).toBe('ready')
  })

  it('retry after bootstrap error works without explicit _reset (guard allows retry)', async () => {
    let shouldFail = true
    provideRepository(createMockRepo({
      bootstrap: async () => {
        if (shouldFail) throw new Error('First attempt fails')
        return emptySnapshot()
      },
    }))
    const store = useAppStore()

    await store.bootstrap()
    expect(store.bootstrapStatus).toBe('error')

    shouldFail = false
    await store.bootstrap()
    expect(store.bootstrapStatus).toBe('ready')
  })

  it('T4C-M36: does not enter ready before bootstrap success', async () => {
    provideRepository(createMockRepo())
    const store = useAppStore()

    expect(store.bootstrapStatus).not.toBe('ready')

    await store.bootstrap()
    expect(store.bootstrapStatus).toBe('ready')
  })
})
