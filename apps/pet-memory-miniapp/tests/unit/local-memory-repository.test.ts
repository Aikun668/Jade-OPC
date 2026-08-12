import { describe, it, expect, beforeEach } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import type { MemoryRepository } from '../../src/types/repository'
import type { MemorySnapshot, MemorySpace, MemoryItem, MemoryDraft } from '../../src/types/domain'
import { emptySnapshot } from '../../src/fixtures/empty-snapshot'
import { completeSnapshot } from '../../src/fixtures/complete-snapshot'
import { validateSnapshot } from '../../src/repositories/snapshot-validation'
import { MemoryStorageAdapter } from '../helpers/memory-storage'
import { LocalMemoryRepository, M0_SNAPSHOT_KEY } from '../../src/repositories/local-memory-repository'
import type { StorageAdapter } from '../../src/adapters/storage'

// ---- 确定性 Clock 与 IdFactory ----

class DeterministicClock {
  private current: number
  constructor(startISO: string) {
    this.current = new Date(startISO).getTime()
  }
  now(): string {
    const ts = new Date(this.current).toISOString()
    this.current += 1000
    return ts
  }
}

class DeterministicIdFactory {
  private counter = 0
  constructor(private prefix: string) {}
  generate(): string {
    this.counter++
    return `${this.prefix}_${this.counter}`
  }
}

// ---- 测试夹具 ----
// LocalMemoryRepository 尚未实现，测试预期因导入失败而报错。
// 实现后，以下 createRepo 将实例化真实的 LocalMemoryRepository。

function createRepo(): MemoryRepository {
  return new LocalMemoryRepository(
    new MemoryStorageAdapter(),
    new DeterministicClock('2026-06-01T00:00:00.000Z'),
    new DeterministicIdFactory('test'),
  )
}

describe('LocalMemoryRepository', () => {
  describe('bootstrap', () => {
    // T3B-M19: 首次 bootstrap 建立并写入空样本
    it('bootstraps from empty storage and writes an empty snapshot', async () => {
      const repo = createRepo()
      const snapshot = await repo.bootstrap()
      expect(snapshot.schemaVersion).toBe(1)
      expect(snapshot.sampleMode).toBe('empty')
      expect(snapshot.spaces).toEqual([])
      expect(snapshot.memories).toEqual([])
      expect(snapshot.drafts).toEqual([])
      expect(snapshot.assets).toEqual([])
    })

    it('bootstraps from existing valid snapshot without overwriting', async () => {
      const storage = new MemoryStorageAdapter()
      // pre-populate storage with a valid empty snapshot
      await storage.set('pet-memory:m0:snapshot', emptySnapshot)

      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      const snapshot = await repo.bootstrap()
      // session-only assets should be expired
      const result = validateSnapshot(snapshot)
      expect(result.kind).toBe('valid')
    })

    // T3B-M19 bonus: bootstrap writes to the correct key
    it('uses the fixed snapshot key for writes', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()
      expect(storage.setCalls).toContain('pet-memory:m0:snapshot')
    })

    it('clears the old pre-generated complete-sample candidate during bootstrap', async () => {
      const legacyCandidate = '第一次见到团团时，它正从纸箱里探出小脑袋，用一双好奇的眼睛打量着我。'
      const storage = new MemoryStorageAdapter()
      const legacySnapshot = {
        ...completeSnapshot,
        memories: completeSnapshot.memories.map(memory =>
          memory.id === 'm_tuantu_photo1'
            ? { ...memory, aiCandidateText: legacyCandidate }
            : memory,
        ),
      }
      await storage.set(M0_SNAPSHOT_KEY, legacySnapshot)

      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )

      const snapshot = await repo.bootstrap()

      expect(snapshot.memories.find(memory => memory.id === 'm_tuantu_photo1')?.aiCandidateText).toBeNull()
      expect((await storage.get<MemorySnapshot>(M0_SNAPSHOT_KEY))?.memories.find(memory => memory.id === 'm_tuantu_photo1')?.aiCandidateText).toBeNull()
    })

    it('bootstraps without requiring the structuredClone global', async () => {
      const storage: StorageAdapter = {
        get: async () => null,
        set: async () => undefined,
        remove: async () => undefined,
      }
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      const originalStructuredClone = globalThis.structuredClone
      globalThis.structuredClone = undefined as unknown as typeof structuredClone

      try {
        await expect(repo.bootstrap()).resolves.toMatchObject({
          sampleMode: 'empty',
          spaces: [],
        })
      } finally {
        globalThis.structuredClone = originalStructuredClone
      }
    })
  })

  describe('spaces', () => {
    // T3B-M20: 创建、修改、删除空间
    it('creates a space and returns it with a full snapshot', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      const result = await repo.createSpace({
        name: '小白',
        coverPhoto: null,
      })
      expect(result.value.name).toBe('小白')
      expect(result.value.id).toBeTruthy()
      expect(result.value.coverAssetId).toBeNull()
      expect(result.snapshot.spaces).toHaveLength(1)
      expect(result.snapshot.spaces[0].name).toBe('小白')
    })

    it('does not let callers mutate the repository state through returned results', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      const created = await repo.createSpace({ name: 'Safe', coverPhoto: null })
      created.value.name = 'Mutated value'
      created.snapshot.spaces[0].name = 'Mutated snapshot'

      const nextWrite = await repo.createSpace({ name: 'Second', coverPhoto: null })
      expect(nextWrite.snapshot.spaces[0].name).toBe('Safe')
    })

    it('creates a space with a cover photo', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      const result = await repo.createSpace({
        name: '小花',
        coverPhoto: { uri: '/tmp/cover.jpg' },
      })
      expect(result.value.coverAssetId).toBeTruthy()
      // cover photo should be session-only
      const coverAsset = result.snapshot.assets.find(a => a.id === result.value.coverAssetId)
      expect(coverAsset).toBeTruthy()
      expect(coverAsset!.persistence).toBe('session-only')
      expect(coverAsset!.ownerType).toBe('space')
    })

    it('updates a space name (keep cover)', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const created = await repo.createSpace({ name: '旧名', coverPhoto: null })

      const result = await repo.updateSpace({
        spaceId: created.value.id,
        name: '新名',
        coverPhotoChange: { kind: 'keep' },
      })
      expect(result.value.name).toBe('新名')
      expect(result.value.coverAssetId).toBeNull()
    })

    it('updates a space replacing cover', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const created = await repo.createSpace({ name: 'A', coverPhoto: null })

      const result = await repo.updateSpace({
        spaceId: created.value.id,
        name: 'A',
        coverPhotoChange: { kind: 'replace', photo: { uri: '/tmp/new-cover.jpg' } },
      })
      expect(result.value.coverAssetId).toBeTruthy()
      // old cover (null) should not leave assets behind; new cover exists
      const coverAssets = result.snapshot.assets.filter(a => a.ownerType === 'space' && a.ownerId === created.value.id)
      expect(coverAssets).toHaveLength(1)
    })

    it('updates a space removing cover', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const created = await repo.createSpace({ name: 'B', coverPhoto: { uri: '/tmp/c.jpg' } })

      const result = await repo.updateSpace({
        spaceId: created.value.id,
        name: 'B',
        coverPhotoChange: { kind: 'remove' },
      })
      expect(result.value.coverAssetId).toBeNull()
    })

    // T3B-M25: 删除空间级联清理该空间的记忆、草稿和资产
    it('deletes a space and cascade-cleans its memories, drafts, and assets', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      // Create a space with a memory, draft, and assets
      const space = await repo.createSpace({ name: 'ToDelete', coverPhoto: { uri: '/tmp/c.jpg' } })
      const draft = await repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'draft', assets: [] })
      const memory = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'hello',
        assets: [{ kind: 'new', asset: { uri: '/tmp/m.jpg' } }],
        sourceDraftId: null,
      })

      const preDeleteAssets = space.snapshot.assets.length + 1 // cover + draft asset(0) + memory asset(1)

      const snapshot = await repo.deleteSpace(space.value.id)

      expect(snapshot.spaces.find(s => s.id === space.value.id)).toBeUndefined()
      expect(snapshot.memories.filter(m => m.spaceId === space.value.id)).toHaveLength(0)
      expect(snapshot.drafts.filter(d => d.spaceId === space.value.id)).toHaveLength(0)
      expect(snapshot.assets.filter(a => a.ownerId === space.value.id)).toHaveLength(0)
      expect(snapshot.assets.filter(a =>
        snapshot.memories.some(m => m.id === a.ownerId) === false &&
        snapshot.drafts.some(d => d.id === a.ownerId) === false &&
        snapshot.spaces.some(s => s.id === a.ownerId) === false,
      )).toHaveLength(0)
    })

    it('fails to update a non-existent space', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      await expect(
        repo.updateSpace({ spaceId: 'nonexistent', name: 'X', coverPhotoChange: { kind: 'keep' } }),
      ).rejects.toThrow()
    })

    it('fails to delete a non-existent space', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      await expect(repo.deleteSpace('nonexistent')).rejects.toThrow()
    })

    // Task 9: 空间级联删除不影���其他空间
    it('T9-R05: deleting a space preserves another space and all its entities', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      // Space 1: with memory, draft, cover
      const s1 = await repo.createSpace({ name: 'ToDelete', coverPhoto: { uri: '/tmp/s1-cover.jpg' } })
      await repo.saveMemory({
        spaceId: s1.value.id,
        entry: 'daily',
        originalText: 's1 memory',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s1-mem.jpg' } }],
        sourceDraftId: null,
      })
      await repo.saveDraft({
        spaceId: s1.value.id,
        entry: 'daily',
        text: 's1 draft',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s1-draft.jpg' } }],
      })

      // Space 2: with memory, draft, cover
      const s2 = await repo.createSpace({ name: 'Keep', coverPhoto: { uri: '/tmp/s2-cover.jpg' } })
      const s2mem = await repo.saveMemory({
        spaceId: s2.value.id,
        entry: 'daily',
        originalText: 's2 memory',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s2-mem.jpg' } }],
        sourceDraftId: null,
      })
      const s2draft = await repo.saveDraft({
        spaceId: s2.value.id,
        entry: 'daily',
        text: 's2 draft',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s2-draft.jpg' } }],
      })

      const snapshot = await repo.deleteSpace(s1.value.id)

      // Space 1 gone entirely
      expect(snapshot.spaces.find(s => s.id === s1.value.id)).toBeUndefined()
      expect(snapshot.memories.filter(m => m.spaceId === s1.value.id)).toHaveLength(0)
      expect(snapshot.drafts.filter(d => d.spaceId === s1.value.id)).toHaveLength(0)

      // Space 2 fully preserved
      const keptSpace = snapshot.spaces.find(s => s.id === s2.value.id)!
      expect(keptSpace).toBeTruthy()
      expect(keptSpace.coverAssetId).toBeTruthy()
      expect(snapshot.memories.find(m => m.id === s2mem.value.id)).toBeTruthy()
      expect(snapshot.drafts.find(d => d.id === s2draft.value.id)).toBeTruthy()
      // s2 assets preserved
      expect(snapshot.assets.filter(a => a.ownerId === s2draft.value.id || a.ownerId === s2mem.value.id || (a.ownerType === 'space' && a.ownerId === s2.value.id)).length).toBe(3)
    })
  })

  describe('memories', () => {
    // T3B-M21: 保存、修改、删除正式记忆
    it('saves a memory without photo', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const result = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: '一段回忆',
        assets: [],
        sourceDraftId: null,
      })
      expect(result.value.originalText).toBe('一段回忆')
      expect(result.value.spaceId).toBe(space.value.id)
      expect(result.snapshot.memories).toHaveLength(1)
    })

    it('saves a memory with new photos', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const result = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'photo',
        originalText: '',
        assets: [
          { kind: 'new', asset: { uri: '/tmp/p1.jpg' } },
          { kind: 'new', asset: { uri: '/tmp/p2.jpg' } },
        ],
        sourceDraftId: null,
      })
      expect(result.value.assetIds).toHaveLength(2)
      const savedAssets = result.snapshot.assets.filter(a => a.ownerType === 'memory' && a.ownerId === result.value.id)
      expect(savedAssets).toHaveLength(2)
      // new photos must be session-only
      for (const a of savedAssets) {
        expect(a.persistence).toBe('session-only')
      }
    })

    it('preserves asset order from input', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const result = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'photo',
        originalText: 'ordered',
        assets: [
          { kind: 'new', asset: { uri: '/tmp/first.jpg' } },
          { kind: 'new', asset: { uri: '/tmp/second.jpg' } },
          { kind: 'new', asset: { uri: '/tmp/third.jpg' } },
        ],
        sourceDraftId: null,
      })
      const assetIds = result.value.assetIds
      const assets = assetIds.map((id: string) => result.snapshot.assets.find(a => a.id === id)!)
      expect(assets[0].order).toBe(0)
      expect(assets[1].order).toBe(1)
      expect(assets[2].order).toBe(2)
    })

    // T3B-M28: 非空原话或至少一张照片的保存下限
    it('rejects saving memory with empty text and no photos', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      await expect(
        repo.saveMemory({ spaceId: space.value.id, entry: 'daily', originalText: '', assets: [], sourceDraftId: null }),
      ).rejects.toThrow()
    })

    // T3B-M29: 单条记忆最多 9 张照片
    it('rejects saving memory with more than 9 photos', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const tenPhotos = Array.from({ length: 10 }, (_, i) => ({
        kind: 'new' as const,
        asset: { uri: `/tmp/p${i}.jpg` },
      }))

      await expect(
        repo.saveMemory({ spaceId: space.value.id, entry: 'photo', originalText: 'too many', assets: tenPhotos, sourceDraftId: null }),
      ).rejects.toThrow()
    })

    // T3B-M30: existing 资产必须属于当前空间或来源草稿
    it('rejects existing asset from a different space', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const s1 = await repo.createSpace({ name: 'S1', coverPhoto: null })
      const s2 = await repo.createSpace({ name: 'S2', coverPhoto: null })

      const memInS1 = await repo.saveMemory({
        spaceId: s1.value.id,
        entry: 'photo',
        originalText: 's1 memory',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s1-pic.jpg' } }],
        sourceDraftId: null,
      })
      const s1AssetId = memInS1.value.assetIds[0]

      await expect(
        repo.saveMemory({
          spaceId: s2.value.id,
          entry: 'photo',
          originalText: 'stealing asset',
          assets: [{ kind: 'existing', assetId: s1AssetId }],
          sourceDraftId: null,
        }),
      ).rejects.toThrow()
    })

    it('accepts existing asset from current space draft when upserting draft', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      // create a draft with a photo
      const d1 = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'first draft',
        assets: [{ kind: 'new', asset: { uri: '/tmp/draft-pic.jpg' } }],
      })
      const draftAssetId = d1.value.assetIds[0]

      // upsert the same draft, keeping the existing photo and adding a new one
      const d2 = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'updated draft',
        assets: [
          { kind: 'existing', assetId: draftAssetId },
          { kind: 'new', asset: { uri: '/tmp/extra.jpg' } },
        ],
      })
      expect(d2.value.assetIds).toContain(draftAssetId)
      expect(d2.value.assetIds).toHaveLength(2)
      // should be the same draft id (upsert)
      expect(d2.value.id).toBe(d1.value.id)
    })

    it('rejects existing asset not from current space in saveDraft', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const s1 = await repo.createSpace({ name: 'S1', coverPhoto: null })
      const s2 = await repo.createSpace({ name: 'S2', coverPhoto: null })

      const memInS1 = await repo.saveMemory({
        spaceId: s1.value.id,
        entry: 'photo',
        originalText: 's1 memory',
        assets: [{ kind: 'new', asset: { uri: '/tmp/s1-pic.jpg' } }],
        sourceDraftId: null,
      })

      await expect(
        repo.saveDraft({
          spaceId: s2.value.id,
          entry: 'daily',
          text: 'stealing',
          assets: [{ kind: 'existing', assetId: memInS1.value.assetIds[0] }],
        }),
      ).rejects.toThrow()
    })

    it('accepts existing asset from source draft in same space', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const draft = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'draft',
        assets: [{ kind: 'new', asset: { uri: '/tmp/draft-pic.jpg' } }],
      })
      const draftAssetId = draft.value.assetIds[0]

      // existing asset from source draft in same space should be accepted
      const mem = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'from draft',
        assets: [{ kind: 'existing', assetId: draftAssetId }],
        sourceDraftId: draft.value.id,
      })
      expect(mem.value.assetIds).toContain(draftAssetId)
    })

    it('updates memory original text', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const saved = await repo.saveMemory({ spaceId: space.value.id, entry: 'daily', originalText: 'old', assets: [], sourceDraftId: null })

      const result = await repo.updateMemory({ kind: 'original-text', memoryId: saved.value.id, originalText: 'new text' })
      expect(result.value.originalText).toBe('new text')
      // updatedAt should change
      expect(new Date(result.value.updatedAt).getTime()).toBeGreaterThan(new Date(saved.value.updatedAt).getTime())
    })

    it('rejects clearing the only text from a text-only memory', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const saved = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'Only text',
        assets: [],
        sourceDraftId: null,
      })

      await expect(repo.updateMemory({
        kind: 'original-text',
        memoryId: saved.value.id,
        originalText: '   ',
      })).rejects.toThrow('Memory must have non-empty text or at least one photo')
    })

    it('updates memory ai candidate text', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const saved = await repo.saveMemory({ spaceId: space.value.id, entry: 'daily', originalText: 'text', assets: [], sourceDraftId: null })

      const result = await repo.updateMemory({ kind: 'ai-candidate', memoryId: saved.value.id, aiCandidateText: 'AI version' })
      expect(result.value.aiCandidateText).toBe('AI version')
    })

    // T3B-M24: 删除记忆只删除该记忆独占资产
    it('deletes a memory and its exclusive assets', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const mem = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'photo',
        originalText: 'with photo',
        assets: [{ kind: 'new', asset: { uri: '/tmp/p.jpg' } }],
        sourceDraftId: null,
      })
      const assetId = mem.value.assetIds[0]

      const snapshot = await repo.deleteMemory(mem.value.id)
      expect(snapshot.memories.find(m => m.id === mem.value.id)).toBeUndefined()
      expect(snapshot.assets.find(a => a.id === assetId)).toBeUndefined()
    })

    // Task 9: 删除记忆也删除 AI 候选稿
    it('T9-R01: deleting a memory with AI candidate text removes both', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const mem = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'text',
        assets: [],
        sourceDraftId: null,
      })
      // Set AI candidate
      const updated = await repo.updateMemory({
        kind: 'ai-candidate',
        memoryId: mem.value.id,
        aiCandidateText: 'AI version',
      })

      const snapshot = await repo.deleteMemory(mem.value.id)
      expect(snapshot.memories.find(m => m.id === mem.value.id)).toBeUndefined()
    })

    // Task 9: 删除记忆不影响同空间其他记忆、空间封面和草稿
    it('T9-R02: deleting a memory does not affect other memories, cover, or drafts', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: { uri: '/tmp/cover.jpg' } })
      const mem1 = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'keep me',
        assets: [{ kind: 'new', asset: { uri: '/tmp/m1.jpg' } }],
        sourceDraftId: null,
      })
      const mem2 = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'delete me',
        assets: [{ kind: 'new', asset: { uri: '/tmp/m2.jpg' } }],
        sourceDraftId: null,
      })
      const draft = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'draft',
        assets: [],
      })

      const snapshot = await repo.deleteMemory(mem2.value.id)

      // mem2 gone
      expect(snapshot.memories.find(m => m.id === mem2.value.id)).toBeUndefined()
      // mem1 still there
      expect(snapshot.memories.find(m => m.id === mem1.value.id)).toBeTruthy()
      // draft still there
      expect(snapshot.drafts.find(d => d.id === draft.value.id)).toBeTruthy()
      // space cover still there
      const s = snapshot.spaces.find(s2 => s2.id === space.value.id)!
      expect(s.coverAssetId).toBeTruthy()
      // mem1's asset still there
      expect(snapshot.assets.find(a => a.id === mem1.value.assetIds[0])).toBeTruthy()
      // mem2's asset gone
      expect(snapshot.assets.find(a => a.id === mem2.value.assetIds[0])).toBeUndefined()
    })

    // Task 9: 删除记忆不影响其他空间
    it('T9-R03: deleting a memory does not affect other spaces', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const s1 = await repo.createSpace({ name: 'S1', coverPhoto: null })
      const s2 = await repo.createSpace({ name: 'S2', coverPhoto: null })
      const mem1 = await repo.saveMemory({
        spaceId: s1.value.id,
        entry: 'daily',
        originalText: 's1 memory',
        assets: [],
        sourceDraftId: null,
      })
      const mem2 = await repo.saveMemory({
        spaceId: s2.value.id,
        entry: 'daily',
        originalText: 's2 memory',
        assets: [],
        sourceDraftId: null,
      })

      const snapshot = await repo.deleteMemory(mem1.value.id)

      expect(snapshot.memories.find(m => m.id === mem1.value.id)).toBeUndefined()
      expect(snapshot.memories.find(m => m.id === mem2.value.id)).toBeTruthy()
      expect(snapshot.spaces.find(s => s.id === s2.value.id)).toBeTruthy()
    })

    it('T9-R04: fails to delete a non-existent memory', async () => {
      const repo = createRepo()
      await repo.bootstrap()

      await expect(repo.deleteMemory('nonexistent')).rejects.toThrow()
    })
  })

  describe('drafts', () => {
    // T3B-M22: 同空间保存草稿执行 upsert，不产生第二条
    it('upserts draft — second save replaces first in same space', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const d1 = await repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'first', assets: [] })
      const d2 = await repo.saveDraft({ spaceId: space.value.id, entry: 'meeting', text: 'second', assets: [] })

      // should have same draft id (upsert)
      expect(d2.value.id).toBe(d1.value.id)
      expect(d2.value.text).toBe('second')
      // snapshot should only have one draft
      const spaceDrafts = d2.snapshot.drafts.filter(d => d.spaceId === space.value.id)
      expect(spaceDrafts).toHaveLength(1)
    })

    it('upsert preserves createdAt but updates updatedAt', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const d1 = await repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'first', assets: [] })
      const d2 = await repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'updated', assets: [] })

      expect(d2.value.createdAt).toBe(d1.value.createdAt)
      expect(new Date(d2.value.updatedAt).getTime()).toBeGreaterThan(new Date(d1.value.updatedAt).getTime())
    })

    // T3B-M23: 删除草稿只删除该草稿独占资产
    it('deletes a draft and its exclusive assets', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const draft = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'draft with photo',
        assets: [{ kind: 'new', asset: { uri: '/tmp/dp.jpg' } }],
      })
      const assetId = draft.value.assetIds[0]

      const snapshot = await repo.deleteDraft(draft.value.id)
      expect(snapshot.drafts.find(d => d.id === draft.value.id)).toBeUndefined()
      expect(snapshot.assets.find(a => a.id === assetId)).toBeUndefined()
    })

    it('does not delete space assets when deleting draft', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: { uri: '/tmp/cover.jpg' } })
      const draft = await repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'x', assets: [] })

      const snapshot = await repo.deleteDraft(draft.value.id)
      // space cover should still exist
      expect(snapshot.spaces.find(s => s.id === space.value.id)!.coverAssetId).toBeTruthy()
    })
  })

  describe('saveMemory with sourceDraftId', () => {
    // T3B-M31: 草稿转正式记忆的创建、转移、删草稿为一次原子结果
    it('atomically creates memory, transfers draft assets, and deletes draft', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      // Create a draft with a photo
      const draft = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'daily',
        text: 'draft content',
        assets: [{ kind: 'new', asset: { uri: '/tmp/draft-pic.jpg' } }],
      })
      const draftAssetId = draft.value.assetIds[0]

      // Save memory from draft
      const result = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'final content',
        assets: [
          { kind: 'existing', assetId: draftAssetId },
          { kind: 'new', asset: { uri: '/tmp/extra.jpg' } },
        ],
        sourceDraftId: draft.value.id,
      })

      // Draft should be gone
      expect(result.snapshot.drafts.find(d => d.id === draft.value.id)).toBeUndefined()
      // Memory should exist
      const mem = result.snapshot.memories.find(m => m.id === result.value.id)!
      expect(mem).toBeTruthy()
      expect(mem.originalText).toBe('final content')
      // Draft asset should now belong to the memory
      const transferredAsset = result.snapshot.assets.find(a => a.id === draftAssetId)!
      expect(transferredAsset.ownerType).toBe('memory')
      expect(transferredAsset.ownerId).toBe(result.value.id)
      // Total assets: draft asset (transferred) + new extra
      expect(result.value.assetIds).toHaveLength(2)
    })

    it('rejects if source draft does not exist', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      await expect(
        repo.saveMemory({
          spaceId: space.value.id,
          entry: 'daily',
          originalText: 'test',
          assets: [],
          sourceDraftId: 'nonexistent',
        }),
      ).rejects.toThrow()
    })

    it('rejects if source draft belongs to different space', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const s1 = await repo.createSpace({ name: 'S1', coverPhoto: null })
      const s2 = await repo.createSpace({ name: 'S2', coverPhoto: null })
      const draft = await repo.saveDraft({ spaceId: s1.value.id, entry: 'daily', text: 'x', assets: [] })

      await expect(
        repo.saveMemory({
          spaceId: s2.value.id,
          entry: 'daily',
          originalText: 'test',
          assets: [],
          sourceDraftId: draft.value.id,
        }),
      ).rejects.toThrow()
    })

    // T3B-M34: 草稿资产与新增资产合并后仍遵守 9 张上限
    it('rejects when draft assets + new assets exceed 9', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      const draft = await repo.saveDraft({
        spaceId: space.value.id,
        entry: 'photo',
        text: '',
        assets: Array.from({ length: 5 }, (_, i) => ({ kind: 'new' as const, asset: { uri: `/tmp/d${i}.jpg` } })),
      })

      const extraPhotos = Array.from({ length: 5 }, (_, i) => ({ kind: 'new' as const, asset: { uri: `/tmp/e${i}.jpg` } }))

      await expect(
        repo.saveMemory({
          spaceId: space.value.id,
          entry: 'photo',
          originalText: '',
          assets: [
            ...draft.value.assetIds.map((id: string) => ({ kind: 'existing' as const, assetId: id })),
            ...extraPhotos,
          ],
          sourceDraftId: draft.value.id,
        }),
      ).rejects.toThrow()
    })
  })

  describe('write failure atomicity', () => {
    // T3B-M26: 写入失败时内存快照保持原状
    it('does not modify state when storage write fails on createSpace', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()

      storage.failNextWrite()
      await expect(
        repo.createSpace({ name: 'ShouldFail', coverPhoto: null }),
      ).rejects.toThrow()

      // State should still be empty
      const snapshot = await repo.bootstrap()
      expect(snapshot.spaces).toHaveLength(0)
    })

    it('does not modify state when storage write fails on saveDraft', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      storage.failNextWrite()
      await expect(
        repo.saveDraft({ spaceId: space.value.id, entry: 'daily', text: 'lost', assets: [] }),
      ).rejects.toThrow()

      // Re-bootstrap to check persisted state
      const snapshot = await repo.bootstrap()
      expect(snapshot.drafts).toHaveLength(0)
    })

    // Task 9: deleteMemory write failure keeps snapshot unchanged
    it('T9-R06: does not modify state when storage write fails on deleteMemory', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })
      const mem = await repo.saveMemory({
        spaceId: space.value.id,
        entry: 'daily',
        originalText: 'text',
        assets: [],
        sourceDraftId: null,
      })

      storage.failNextWrite()
      await expect(repo.deleteMemory(mem.value.id)).rejects.toThrow()

      // Re-bootstrap — memory should still exist
      const snapshot = await repo.bootstrap()
      expect(snapshot.memories.find(m => m.id === mem.value.id)).toBeTruthy()
    })

    // Task 9: deleteSpace write failure keeps snapshot unchanged
    it('T9-R07: does not modify state when storage write fails on deleteSpace', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()
      const space = await repo.createSpace({ name: 'S', coverPhoto: null })

      storage.failNextWrite()
      await expect(repo.deleteSpace(space.value.id)).rejects.toThrow()

      // Re-bootstrap — space should still exist
      const snapshot = await repo.bootstrap()
      expect(snapshot.spaces.find(s => s.id === space.value.id)).toBeTruthy()
    })
  })

  describe('resetSample', () => {
    // T3B-M27: resetSample('complete') 返回合法完整样本
    it('resets to empty sample', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const snapshot = await repo.resetSample('empty')
      expect(snapshot.sampleMode).toBe('empty')
      expect(snapshot.spaces).toHaveLength(0)
    })

    it('resets to complete sample', async () => {
      const repo = createRepo()
      await repo.bootstrap()
      const snapshot = await repo.resetSample('complete')
      expect(snapshot.sampleMode).toBe('complete')
      // should contain 团团 and 豆豆
      expect(snapshot.spaces).toHaveLength(2)
      expect(snapshot.spaces.find(s => s.name === '团团')).toBeTruthy()
      expect(snapshot.spaces.find(s => s.name === '豆豆')).toBeTruthy()
    })

    it('reset write-failure keeps original state', async () => {
      const storage = new MemoryStorageAdapter()
      const repo = new LocalMemoryRepository(
        storage,
        new DeterministicClock('2026-06-01T00:00:00.000Z'),
        new DeterministicIdFactory('test'),
      )
      await repo.bootstrap()
      await repo.createSpace({ name: 'Original', coverPhoto: null })

      storage.failNextWrite()
      await expect(repo.resetSample('complete')).rejects.toThrow()

      // Space should still exist
      const snapshot = await repo.bootstrap()
      expect(snapshot.spaces).toHaveLength(1)
      expect(snapshot.spaces[0].name).toBe('Original')
    })
  })

  describe('fixture integrity', () => {
    // T3B-M14 ~ M18: fixtures pass validation
    it('empty snapshot fixture passes validation', () => {
      const result = validateSnapshot(emptySnapshot)
      expect(result.kind).toBe('valid')
    })

    it('complete snapshot fixture passes validation', () => {
      const result = validateSnapshot(completeSnapshot)
      expect(result.kind).toBe('valid')
    })

    it('complete snapshot contains two spaces', () => {
      expect(completeSnapshot.spaces).toHaveLength(2)
    })

    it('complete snapshot covers states: with photo, with draft, no photo, no memories', () => {
      // 团团: has photo, has memories, has draft
      const tuantuMemories = completeSnapshot.memories.filter(m => m.spaceId === 's_tuantu')
      expect(tuantuMemories.length).toBeGreaterThan(0)
      const tuantuDrafts = completeSnapshot.drafts.filter(d => d.spaceId === 's_tuantu')
      expect(tuantuDrafts.length).toBeGreaterThan(0)

      // 豆豆: no photo, no memories
      const doudou = completeSnapshot.spaces.find(s => s.id === 's_doudou')!
      expect(doudou.coverAssetId).toBeNull()
      const doudouMemories = completeSnapshot.memories.filter(m => m.spaceId === 's_doudou')
      expect(doudouMemories).toHaveLength(0)
    })

    it('complete snapshot uses only bundled assets', () => {
      for (const a of completeSnapshot.assets) {
        expect(a.persistence).toBe('bundled')
      }
    })

    // T5A-T2-M01: 每个 bundled + available 资产都有对应的 static/ 文件
    it('every bundled available asset maps to a real static/fixtures file', () => {
      const projectRoot = join(__dirname, '..', '..')
      const bundledAvailable = completeSnapshot.assets.filter(
        a => a.persistence === 'bundled' && a.availability === 'available',
      )

      expect(bundledAvailable.length).toBeGreaterThan(0)

      const missing: string[] = []
      for (const asset of bundledAvailable) {
        // Runtime URI (e.g. /fixtures/xxx.png) maps to source static/ directory
        const relativePath = asset.uri.replace(/^\//, '')
        const sourcePath = join(projectRoot, 'static', relativePath)
        if (!existsSync(sourcePath)) {
          missing.push(`${asset.id}: ${asset.uri} → ${sourcePath}`)
        }
      }

      if (missing.length > 0) {
        expect.fail(
          `Bundled asset files missing in static/fixtures/:\n${missing.join('\n')}`,
        )
      }
    })
  })
})
