import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { MemorySnapshot } from '../../src/types/domain'
import type { MemoryRepository } from '../../src/types/repository'
import { provideRepository, _resetRepository } from '../../src/stores/deps'
import { useMemoryStore } from '../../src/stores/memory'
import { useAppStore } from '../../src/stores/app'
import { useDevScenarios } from '../../src/features/developer/dev-scenarios'

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

function createMockRepo(overrides: Partial<MemoryRepository> = {}): MemoryRepository {
  return {
    bootstrap: async () => mkSnapshot(),
    createSpace: async () => ({ value: {} as any, snapshot: mkSnapshot() }),
    updateSpace: async () => ({ value: {} as any, snapshot: mkSnapshot() }),
    deleteSpace: async () => mkSnapshot(),
    saveMemory: async () => ({ value: {} as any, snapshot: mkSnapshot() }),
    updateMemory: async () => ({ value: {} as any, snapshot: mkSnapshot() }),
    deleteMemory: async () => mkSnapshot(),
    saveDraft: async () => ({ value: {} as any, snapshot: mkSnapshot() }),
    deleteDraft: async () => mkSnapshot(),
    resetSample: async () => mkSnapshot(),
    completeOnboarding: async () => mkSnapshot(),
    ...overrides,
  }
}

describe('useDevScenarios', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetRepository()
    useMemoryStore()._reset()
  })

  // T4D-M01: Switch empty/complete samples via Repository resetSample
  it('T4D-M01: resetSample calls repository resetSample and updates stores', async () => {
    let calledMode = ''
    provideRepository(createMockRepo({
      resetSample: async (mode: string) => {
        calledMode = mode
        return mkSnapshot({ sampleMode: mode as any, spaces: [{ id: 's1', name: 'Test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }] })
      },
    }))
    const { resetSample } = useDevScenarios()

    await resetSample('complete')

    expect(calledMode).toBe('complete')
    const memStore = useMemoryStore()
    expect(memStore.spaces).toHaveLength(1)
  })

  // T4D-M02: Reset data → both stores sync
  it('T4D-M02: reset syncs both memoryStore and appStore', async () => {
    provideRepository(createMockRepo({
      resetSample: async () => mkSnapshot({
        sampleMode: 'complete',
        schemaVersion: 1,
      }),
    }))
    const { resetSample } = useDevScenarios()

    await resetSample('complete')

    const appStore = useAppStore()
    expect(appStore.sampleMode).toBe('complete')
    expect(appStore.schemaVersion).toBe(1)
  })

  // T4D-M03: AI mock scenes restricted to success/insufficient/unavailable
  it('T4D-M03: setAiScenario accepts only whitelisted values', () => {
    const { setAiScenario, aiScenario } = useDevScenarios()

    setAiScenario('success')
    expect(aiScenario.value).toBe('success')

    setAiScenario('insufficient')
    expect(aiScenario.value).toBe('insufficient')

    setAiScenario('unavailable')
    expect(aiScenario.value).toBe('unavailable')
  })

  // T4D-M04: Save failure toggle
  it('T4D-M04: toggleSaveFailure switches state', () => {
    const { toggleSaveFailure, saveFailureEnabled } = useDevScenarios()

    expect(saveFailureEnabled.value).toBe(false)
    toggleSaveFailure()
    expect(saveFailureEnabled.value).toBe(true)
    toggleSaveFailure()
    expect(saveFailureEnabled.value).toBe(false)
  })

  // T4D-M05: Photo failure toggle
  it('T4D-M05: togglePhotoFailure switches state', () => {
    const { togglePhotoFailure, photoFailureEnabled } = useDevScenarios()

    expect(photoFailureEnabled.value).toBe(false)
    togglePhotoFailure()
    expect(photoFailureEnabled.value).toBe(true)
  })

  // T4D-M06: Permission denied toggle
  it('T4D-M06: togglePermissionDenied switches state', () => {
    const { togglePermissionDenied, permissionDeniedEnabled } = useDevScenarios()

    expect(permissionDeniedEnabled.value).toBe(false)
    togglePermissionDenied()
    expect(permissionDeniedEnabled.value).toBe(true)
  })

  // T4D-M07: Same scene repeatable with deterministic result
  it('T4D-M07: same AI scenario can be selected repeatedly', () => {
    const { setAiScenario, aiScenario } = useDevScenarios()

    setAiScenario('success')
    setAiScenario('success')
    expect(aiScenario.value).toBe('success')

    setAiScenario('insufficient')
    setAiScenario('insufficient')
    expect(aiScenario.value).toBe('insufficient')
  })

  // T4D-M08: Scene state in dev-scenarios.ts, not a third store
  it('T4D-M08: no third Pinia store created for dev scenarios', () => {
    // useDevScenarios returns plain reactive state, not defineStore
    // This is verified at type level: the returned object is not a Store
    const scenarios = useDevScenarios()
    expect(scenarios.aiScenario).toBeDefined()
    // Pinia stores have $id, $state, etc. — this doesn't
    expect((scenarios as any).$id).toBeUndefined()
  })

  // T4D-M12: Sample switch has in-progress state preventing concurrent ops
  it('T4D-M12: isResetting prevents concurrent resetSample calls', async () => {
    let callCount = 0
    provideRepository(createMockRepo({
      resetSample: async () => {
        callCount++
        return mkSnapshot()
      },
    }))
    const { resetSample, isResetting } = useDevScenarios()

    // Fire two calls concurrently — first sets isResetting=true, second should be no-op
    await Promise.all([resetSample('empty'), resetSample('complete')])

    // Without the guard, callCount would be 2. With guard, only 1 call reaches repo.
    expect(callCount).toBe(1)
    expect(isResetting.value).toBe(false)
  })

  // T4D-M13: Operation failure shows dev-readable feedback
  it('T4D-M13: resetSample failure sets error message', async () => {
    provideRepository(createMockRepo({
      resetSample: async () => { throw new Error('Storage full') },
    }))
    const { resetSample, lastResetError } = useDevScenarios()

    await expect(resetSample('empty')).rejects.toThrow('Storage full')
    expect(lastResetError.value).toBe('Storage full')
  })

  // T4D-M23: After failure, can re-operate
  it('T4D-M23: after reset failure, can try again', async () => {
    let shouldFail = true
    provideRepository(createMockRepo({
      resetSample: async () => {
        if (shouldFail) throw new Error('fail')
        return mkSnapshot()
      },
    }))
    const { resetSample, lastResetError, isResetting } = useDevScenarios()

    await expect(resetSample('empty')).rejects.toThrow('fail')
    expect(lastResetError.value).toBe('fail')
    expect(isResetting.value).toBe(false)

    // Retry should work
    shouldFail = false
    await resetSample('complete')
    expect(lastResetError.value).toBeNull()
  })

  // T4D-M10: getCurrentMeta returns schema info (non-sensitive)
  it('T4D-M10: getCurrentMeta returns schemaVersion and bootstrapStatus', () => {
    const appStore = useAppStore()
    appStore.bootstrapStatus = 'ready'
    appStore.sampleMode = 'complete'
    appStore.schemaVersion = 1

    const { getCurrentMeta } = useDevScenarios()
    const meta = getCurrentMeta()

    expect(meta.schemaVersion).toBe(1)
    expect(meta.sampleMode).toBe('complete')
    expect(meta.bootstrapStatus).toBe('ready')
  })

  // T4D-M11: getCurrentMeta does not expose user text, AI candidates, photo URIs
  it('T4D-M11: getCurrentMeta does not expose private data', () => {
    const memStore = useMemoryStore()
    memStore._commitSnapshot(mkSnapshot({
      memories: [{
        id: 'm1', spaceId: 's1', entry: 'daily',
        originalText: 'secret text',
        aiCandidateText: 'ai generated',
        assetIds: ['a1'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      assets: [{
        id: 'a1', ownerType: 'memory', ownerId: 'm1',
        uri: '/private/photo.jpg',
        persistence: 'session-only', availability: 'available', order: 0,
      }],
    }))

    const { getCurrentMeta } = useDevScenarios()
    const meta = getCurrentMeta()

    // Meta only contains schema-level info, no user content
    expect(JSON.stringify(meta)).not.toContain('secret text')
    expect(JSON.stringify(meta)).not.toContain('ai generated')
    expect(JSON.stringify(meta)).not.toContain('/private/photo.jpg')
  })
})
