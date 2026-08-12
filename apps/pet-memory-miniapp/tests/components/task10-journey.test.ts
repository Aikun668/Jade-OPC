import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideRepository, _resetRepository } from '../../src/stores/deps'
import { LocalMemoryRepository, M0_SNAPSHOT_KEY } from '../../src/repositories/local-memory-repository'
import { MemoryStorageAdapter } from '../helpers/memory-storage'
import { MockAiDraftService } from '../../src/services/mock-ai-draft-service'
import { parseMemoryRoute, parsePrivacyRoute } from '../../src/features/routing/route-params'
import type { AiMockScenario } from '../../src/types/ai'
import type { Clock } from '../../src/utils/dates'
import type { IdFactory } from '../../src/utils/ids'

class FixedClock implements Clock {
  now(): string {
    return '2026-08-06T08:00:00.000Z'
  }
}

class SequentialIdFactory implements IdFactory {
  private nextId = 0

  generate(): string {
    this.nextId += 1
    return `task10_${this.nextId}`
  }
}

function createJourneyContext() {
  const storage = new MemoryStorageAdapter()
  const repository = new LocalMemoryRepository(storage, new FixedClock(), new SequentialIdFactory())
  provideRepository(repository)

  return {
    storage,
    repository,
    app: useAppStore(),
    memory: useMemoryStore(),
  }
}

describe('Task 10 M0 integration journeys', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetRepository()
  })

  it('T10-E01: empty onboarding can create, save, open detail, and return to all memories without stale data', async () => {
    const { app, memory } = createJourneyContext()

    await app.bootstrap()
    expect(app.bootstrapStatus).toBe('ready')
    expect(app.hasCompletedOnboarding).toBe(false)
    expect(memory.spaces).toHaveLength(0)

    await app.completeOnboarding()
    const space = await memory.createSpace({ name: 'Task 10 space', coverPhoto: null })
    const saved = await memory.saveMemory({
      spaceId: space.id,
      entry: 'daily',
      originalText: 'A first memory created from the empty path.',
      assets: [],
      sourceDraftId: null,
    })

    expect(app.hasCompletedOnboarding).toBe(true)
    expect(memory.findMemory(saved.id)?.originalText).toContain('first memory')
    expect(memory.allMemories(space.id).map(item => item.id)).toEqual([saved.id])
    expect(memory.spaces.map(item => item.name)).toEqual(['Task 10 space'])
  })

  it('T10-D01: a draft is resumed into one formal memory and cannot leave a second draft behind', async () => {
    const { app, memory } = createJourneyContext()

    await app.bootstrap()
    await memory.resetSample('complete')
    const sourceDraft = memory.draftForSpace('s_tuantu')
    expect(sourceDraft).not.toBeNull()

    const formal = await memory.saveMemory({
      spaceId: 's_tuantu',
      entry: sourceDraft!.entry,
      originalText: sourceDraft!.text,
      assets: sourceDraft!.assetIds.map(assetId => ({ kind: 'existing' as const, assetId })),
      sourceDraftId: sourceDraft!.id,
    })

    expect(memory.draftForSpace('s_tuantu')).toBeNull()
    expect(memory.memories.filter(item => item.spaceId === 's_tuantu')).toHaveLength(3)
    expect(memory.findAsset(formal.assetIds[0])?.ownerType).toBe('memory')

    const replacementDraft = await memory.saveDraft({
      spaceId: 's_tuantu',
      entry: 'daily',
      text: 'A new draft that the user chooses to discard.',
      assets: [],
    })
    await memory.deleteDraft(replacementDraft.id)

    expect(memory.draftForSpace('s_tuantu')).toBeNull()
    expect(memory.memories.filter(item => item.spaceId === 's_tuantu')).toHaveLength(3)
  })

  it('T10-C01: complete sample keeps sorting, two-photo detail, original text, and AI candidate separate', async () => {
    const { app, memory } = createJourneyContext()

    await app.bootstrap()
    await memory.resetSample('complete')

    expect(memory.spaces).toHaveLength(2)
    expect(memory.sortedSpaces[0].id).toBe('s_tuantu')
    expect(memory.recentMemories('s_tuantu')).toHaveLength(2)
    expect(memory.allMemories('s_tuantu')).toHaveLength(2)
    expect(memory.findMemory('m_tuantu_photo1')?.assetIds).toHaveLength(2)
    expect(memory.findMemory('m_tuantu_photo1')?.aiCandidateText).toBeNull()

    const original = memory.findMemory('m_tuantu_daily1')!.originalText
    await memory.updateMemory({
      kind: 'original-text',
      memoryId: 'm_tuantu_daily1',
      originalText: 'The edited original text remains user-owned.',
    })
    await memory.updateMemory({
      kind: 'ai-candidate',
      memoryId: 'm_tuantu_daily1',
      aiCandidateText: 'An optional candidate text.',
    })

    expect(memory.findMemory('m_tuantu_daily1')?.originalText).not.toBe(original)
    expect(memory.findMemory('m_tuantu_daily1')?.aiCandidateText).toBe('An optional candidate text.')
    expect(memory.findMemory('m_tuantu_photo1')?.assetIds).toEqual([
      'a_tuantu_photo1',
      'a_tuantu_photo2',
    ])
  })

  it('T10-C02: deleting a memory removes only its owned assets', async () => {
    const { app, memory } = createJourneyContext()

    await app.bootstrap()
    await memory.resetSample('complete')
    await memory.deleteMemory('m_tuantu_photo1')

    expect(memory.findMemory('m_tuantu_photo1')).toBeNull()
    expect(memory.assets.some(asset => asset.ownerId === 'm_tuantu_photo1')).toBe(false)
    expect(memory.findMemory('m_tuantu_daily1')).not.toBeNull()
    expect(memory.draftForSpace('s_tuantu')).not.toBeNull()
    expect(memory.findSpace('s_doudou')).not.toBeNull()
  })

  it('T10-C03: deleting one space cascades its memories, drafts, and assets while preserving the other space', async () => {
    const { app, memory } = createJourneyContext()

    await app.bootstrap()
    await memory.resetSample('complete')
    await memory.deleteSpace('s_tuantu')

    expect(memory.findSpace('s_tuantu')).toBeNull()
    expect(memory.findSpace('s_doudou')?.name).toBe('豆豆')
    expect(memory.memories.every(item => item.spaceId !== 's_tuantu')).toBe(true)
    expect(memory.drafts.every(item => item.spaceId !== 's_tuantu')).toBe(true)
    expect(memory.assets.some(asset => asset.ownerId === 's_tuantu')).toBe(false)
    expect(memory.assets.some(asset => asset.ownerId === 's_doudou')).toBe(false)
  })

  it('T10-F01: write failure, missing routes, and AI fallback states are recoverable and explicit', async () => {
    const { app, memory, repository, storage } = createJourneyContext()

    await app.bootstrap()
    storage.failNextWrite()
    await expect(memory.createSpace({ name: 'Should not commit', coverPhoto: null })).rejects.toThrow('Injected write failure')
    expect(memory.spaces).toHaveLength(0)
    expect((await repository.bootstrap()).spaces).toHaveLength(0)

    expect(parseMemoryRoute({}).kind).toBe('invalid')
    expect(parsePrivacyRoute({ source: 'unexpected' }).kind).toBe('invalid')

    let scenario: AiMockScenario = 'success'
    const ai = new MockAiDraftService(() => scenario, 0)
    expect((await ai.createDraft({ memoryId: 'm1', originalText: 'text' })).kind).toBe('success')
    scenario = 'insufficient'
    expect((await ai.createDraft({ memoryId: 'm1', originalText: 'text' })).kind).toBe('insufficient')
    scenario = 'unavailable'
    expect((await ai.createDraft({ memoryId: 'm1', originalText: 'text' })).kind).toBe('unavailable')

    const unsupportedStorage = new MemoryStorageAdapter()
    await unsupportedStorage.set(M0_SNAPSHOT_KEY, { schemaVersion: 99 })
    const unsupportedRepository = new LocalMemoryRepository(unsupportedStorage, new FixedClock(), new SequentialIdFactory())
    await expect(unsupportedRepository.bootstrap()).rejects.toThrow('Unsupported snapshot version: 99')
  })
})
