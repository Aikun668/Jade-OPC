import type { MemoryRepository } from '../types/repository'
import type {
  MemorySnapshot,
  MemorySpace,
  MemoryItem,
  MemoryDraft,
  LocalAsset,
  SampleMode,
  CreateSpaceInput,
  UpdateSpaceInput,
  SaveMemoryInput,
  UpdateMemoryInput,
  SaveDraftInput,
  RepositoryWriteResult,
} from '../types/domain'
import type { StorageAdapter } from '../adapters/storage'
import type { PhotoFileStorage } from '../adapters/photo-file-storage'
import type { Clock } from '../utils/dates'
import type { IdFactory } from '../utils/ids'
import { validateSnapshot, expireSessionAssets } from './snapshot-validation'
import { emptySnapshot } from '../fixtures/empty-snapshot'
import { completeSnapshot } from '../fixtures/complete-snapshot'

export const M0_SNAPSHOT_KEY = 'pet-memory:m0:snapshot'
const M0_ACTIVE_SAMPLE_MODE_KEY = 'pet-memory:m0:active-sample-mode'
const M0_SAMPLE_SNAPSHOT_PREFIX = 'pet-memory:m0:sample'

// The complete fixture used to ship with a candidate on the photo memory.
// Clear only that exact legacy fixture value; user-created candidates remain
// persisted normally.
const LEGACY_COMPLETE_SAMPLE_CANDIDATE =
  '第一次见到团团时，它正从纸箱里探出小脑袋，用一双好奇的眼睛打量着我。'

function cloneValue<T>(value: T): T {
  // M0 snapshots only contain JSON data. Use the JSON round-trip here because
  // the WeChat mini-program runtime does not expose the browser/Node
  // `structuredClone` global.
  return JSON.parse(JSON.stringify(value)) as T
}

function isSampleMode(value: unknown): value is SampleMode {
  return value === 'empty' || value === 'complete'
}

function makeSampleStorageKey(mode: SampleMode): string {
  return `${M0_SAMPLE_SNAPSHOT_PREFIX}:${mode}`
}

export class LocalMemoryRepository implements MemoryRepository {
  private current: MemorySnapshot | null = null

  constructor(
    private storage: StorageAdapter,
    private clock: Clock,
    private idFactory: IdFactory,
    private photoFileStorage?: PhotoFileStorage,
  ) {}

  async bootstrap(): Promise<MemorySnapshot> {
    const activeMode = await this.storage.get<unknown>(M0_ACTIVE_SAMPLE_MODE_KEY)
    const activeSnapshot = isSampleMode(activeMode)
      ? await this.storage.get<MemorySnapshot>(makeSampleStorageKey(activeMode))
      : null

    const raw = activeSnapshot ?? await this.storage.get<MemorySnapshot>(M0_SNAPSHOT_KEY)
    if (raw === null) {
      const validated = validateSnapshot(emptySnapshot)
      if (validated.kind !== 'valid') {
        throw new Error('Empty snapshot fixture is invalid')
      }
      const initialSnapshot = cloneValue(emptySnapshot)
      return this.bootstrapWithSnapshot(initialSnapshot)
    }

    const snapshot = await this.normalizeStoredSnapshot(raw)
    if (isSampleMode(activeMode) && snapshot.sampleMode !== activeMode) {
      throw new Error(`Stored sample mode mismatch: expected ${activeMode}, got ${snapshot.sampleMode}`)
    }
    return this.bootstrapWithSnapshot(snapshot)
  }

  async createSpace(input: CreateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>> {
    const snap = this.ensureCurrent()
    const now = this.clock.now()
    const id = this.idFactory.generate()

    const space: MemorySpace = {
      id,
      name: input.name,
      coverAssetId: null,
      createdAt: now,
      updatedAt: now,
    }

    let assets = [...snap.assets]

    if (input.coverPhoto) {
      const assetId = this.idFactory.generate()
      const asset: LocalAsset = {
        id: assetId,
        ownerType: 'space',
        ownerId: id,
        uri: input.coverPhoto.uri,
        persistence: input.coverPhoto.persistence ?? 'session-only',
        availability: 'available',
        order: 0,
      }
      space.coverAssetId = assetId
      assets = [...assets, asset]
    }

    const candidate: MemorySnapshot = {
      ...snap,
      spaces: [...snap.spaces, space],
      assets,
    }

    const committed = await this.commit(candidate)
    return { value: cloneValue(space), snapshot: committed }
  }

  async updateSpace(input: UpdateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>> {
    const snap = this.ensureCurrent()
    const idx = snap.spaces.findIndex(s => s.id === input.spaceId)
    if (idx === -1) {
      throw new Error(`Space not found: ${input.spaceId}`)
    }

    const oldSpace = snap.spaces[idx]
    let assets = [...snap.assets]
    let coverAssetId = oldSpace.coverAssetId

    if (input.coverPhotoChange.kind === 'remove') {
      if (coverAssetId) {
        assets = assets.filter(a => a.id !== coverAssetId)
      }
      coverAssetId = null
    } else if (input.coverPhotoChange.kind === 'replace') {
      // remove old cover
      if (coverAssetId) {
        assets = assets.filter(a => a.id !== coverAssetId)
      }
      // add new cover
      const assetId = this.idFactory.generate()
      const asset: LocalAsset = {
        id: assetId,
        ownerType: 'space',
        ownerId: input.spaceId,
        uri: input.coverPhotoChange.photo.uri,
        persistence: input.coverPhotoChange.photo.persistence ?? 'session-only',
        availability: 'available',
        order: 0,
      }
      assets = [...assets, asset]
      coverAssetId = assetId
    }

    const updatedSpace: MemorySpace = {
      ...oldSpace,
      name: input.name,
      coverAssetId,
      updatedAt: this.clock.now(),
    }

    const spaces = [...snap.spaces]
    spaces[idx] = updatedSpace

    const candidate: MemorySnapshot = {
      ...snap,
      spaces,
      assets,
    }

    const committed = await this.commit(candidate)
    return { value: cloneValue(updatedSpace), snapshot: committed }
  }

  async deleteSpace(spaceId: string): Promise<MemorySnapshot> {
    const snap = this.ensureCurrent()
    if (!snap.spaces.find(s => s.id === spaceId)) {
      throw new Error(`Space not found: ${spaceId}`)
    }

    const memoryIds = new Set(
      snap.memories.filter(m => m.spaceId === spaceId).map(m => m.id),
    )
    const draftIds = new Set(
      snap.drafts.filter(d => d.spaceId === spaceId).map(d => d.id),
    )

    const candidate: MemorySnapshot = {
      ...snap,
      spaces: snap.spaces.filter(s => s.id !== spaceId),
      memories: snap.memories.filter(m => m.spaceId !== spaceId),
      drafts: snap.drafts.filter(d => d.spaceId !== spaceId),
      assets: snap.assets.filter(a => {
        if (a.ownerType === 'space' && a.ownerId === spaceId) return false
        if (a.ownerType === 'memory' && memoryIds.has(a.ownerId)) return false
        if (a.ownerType === 'draft' && draftIds.has(a.ownerId)) return false
        return true
      }),
    }

    return this.commit(candidate)
  }

  async saveMemory(input: SaveMemoryInput): Promise<RepositoryWriteResult<MemoryItem>> {
    const snap = this.ensureCurrent()

    // validate non-empty
    if (!input.originalText.trim() && input.assets.length === 0) {
      throw new Error('Memory must have non-empty text or at least one photo')
    }

    // validate photo limit
    const totalPhotos = input.assets.length
    if (totalPhotos > 9) {
      throw new Error(`Memory cannot have more than 9 photos (got ${totalPhotos})`)
    }

    // resolve source draft
    let sourceDraft: MemoryDraft | null = null
    if (input.sourceDraftId) {
      sourceDraft = snap.drafts.find(d => d.id === input.sourceDraftId) ?? null
      if (!sourceDraft) {
        throw new Error(`Source draft not found: ${input.sourceDraftId}`)
      }
      if (sourceDraft.spaceId !== input.spaceId) {
        throw new Error(`Source draft belongs to space ${sourceDraft.spaceId}, not ${input.spaceId}`)
      }
      // merge draft assets + new assets
      const mergedCount = sourceDraft.assetIds.length + input.assets.filter(a => a.kind === 'new').length
      if (mergedCount > 9) {
        throw new Error(`Memory cannot have more than 9 photos (got ${mergedCount})`)
      }
    }

    const now = this.clock.now()
    const memoryId = this.idFactory.generate()
    const assetIds: string[] = []
    let assets = [...snap.assets]

    for (const assetInput of input.assets) {
      if (assetInput.kind === 'new') {
        const assetId = this.idFactory.generate()
        const asset: LocalAsset = {
          id: assetId,
          ownerType: 'memory',
          ownerId: memoryId,
          uri: assetInput.asset.uri,
          persistence: 'session-only',
          availability: 'available',
          order: assetIds.length,
        }
        assets = [...assets, asset]
        assetIds.push(assetId)
      } else {
        // existing asset
        const existingAsset = snap.assets.find(a => a.id === assetInput.assetId)
        if (!existingAsset) {
          throw new Error(`Asset not found: ${assetInput.assetId}`)
        }
        // space-owned assets cannot be transferred to a memory
        if (existingAsset.ownerType === 'space') {
          throw new Error(`Asset ${assetInput.assetId} is owned by a space and cannot be transferred to a memory`)
        }
        // must belong to current space or source draft
        const belongsToCurrentSpace = this.assetBelongsToSpace(existingAsset, input.spaceId, snap)
        const belongsToSourceDraft = sourceDraft && existingAsset.ownerType === 'draft' && existingAsset.ownerId === sourceDraft.id

        if (!belongsToCurrentSpace && !belongsToSourceDraft) {
          throw new Error(`Asset ${assetInput.assetId} does not belong to space ${input.spaceId} or the source draft`)
        }

        // transfer ownership
        assets = assets.map(a =>
          a.id === assetInput.assetId
            ? { ...a, ownerType: 'memory' as const, ownerId: memoryId, order: assetIds.length }
            : a,
        )
        assetIds.push(assetInput.assetId)
      }
    }

    const memory: MemoryItem = {
      id: memoryId,
      spaceId: input.spaceId,
      entry: input.entry,
      originalText: input.originalText,
      aiCandidateText: null,
      assetIds,
      createdAt: now,
      updatedAt: now,
    }

    // remove source draft if present
    let drafts = snap.drafts
    if (sourceDraft) {
      drafts = drafts.filter(d => d.id !== sourceDraft.id)
    }

    const candidate: MemorySnapshot = {
      ...snap,
      memories: [...snap.memories, memory],
      drafts,
      assets,
    }

    const committed = await this.commit(candidate)
    return { value: cloneValue(memory), snapshot: committed }
  }

  async updateMemory(input: UpdateMemoryInput): Promise<RepositoryWriteResult<MemoryItem>> {
    const snap = this.ensureCurrent()
    const idx = snap.memories.findIndex(m => m.id === input.memoryId)
    if (idx === -1) {
      throw new Error(`Memory not found: ${input.memoryId}`)
    }

    const oldMemory = snap.memories[idx]
    const now = this.clock.now()

    let updatedMemory: MemoryItem
    if (input.kind === 'original-text') {
      if (!input.originalText.trim() && oldMemory.assetIds.length === 0) {
        throw new Error('Memory must have non-empty text or at least one photo')
      }
      updatedMemory = { ...oldMemory, originalText: input.originalText, updatedAt: now }
    } else {
      updatedMemory = { ...oldMemory, aiCandidateText: input.aiCandidateText, updatedAt: now }
    }

    const memories = [...snap.memories]
    memories[idx] = updatedMemory

    const candidate: MemorySnapshot = { ...snap, memories }
    const committed = await this.commit(candidate)
    return { value: cloneValue(updatedMemory), snapshot: committed }
  }

  async deleteMemory(memoryId: string): Promise<MemorySnapshot> {
    const snap = this.ensureCurrent()
    if (!snap.memories.find(m => m.id === memoryId)) {
      throw new Error(`Memory not found: ${memoryId}`)
    }

    const candidate: MemorySnapshot = {
      ...snap,
      memories: snap.memories.filter(m => m.id !== memoryId),
      assets: snap.assets.filter(a => !(a.ownerType === 'memory' && a.ownerId === memoryId)),
    }

    return this.commit(candidate)
  }

  async saveDraft(input: SaveDraftInput): Promise<RepositoryWriteResult<MemoryDraft>> {
    const snap = this.ensureCurrent()
    const now = this.clock.now()

    // find existing draft in this space (upsert)
    const existingIdx = snap.drafts.findIndex(d => d.spaceId === input.spaceId)
    let draftId: string
    let createdAt: string
    const oldDraftAssetIds: string[] = []

    if (existingIdx !== -1) {
      const existing = snap.drafts[existingIdx]
      draftId = existing.id
      createdAt = existing.createdAt
      oldDraftAssetIds.push(...existing.assetIds)
    } else {
      draftId = this.idFactory.generate()
      createdAt = now
    }

    let assets = [...snap.assets]
    const assetIds: string[] = []

    for (const assetInput of input.assets) {
      if (assetInput.kind === 'new') {
        const assetId = this.idFactory.generate()
        const asset: LocalAsset = {
          id: assetId,
          ownerType: 'draft',
          ownerId: draftId,
          uri: assetInput.asset.uri,
          persistence: 'session-only',
          availability: 'available',
          order: assetIds.length,
        }
        assets = [...assets, asset]
        assetIds.push(assetId)
      } else {
        // existing asset — must belong to current space
        const existingAsset = snap.assets.find(a => a.id === assetInput.assetId)
        if (!existingAsset) {
          throw new Error(`Asset not found: ${assetInput.assetId}`)
        }
        // space-owned assets cannot be transferred to a draft
        if (existingAsset.ownerType === 'space') {
          throw new Error(`Asset ${assetInput.assetId} is owned by a space and cannot be transferred to a draft`)
        }
        if (!this.assetBelongsToSpace(existingAsset, input.spaceId, snap)) {
          throw new Error(`Asset ${assetInput.assetId} does not belong to space ${input.spaceId}`)
        }
        // transfer to draft ownership
        assets = assets.map(a =>
          a.id === assetInput.assetId
            ? { ...a, ownerType: 'draft' as const, ownerId: draftId, order: assetIds.length }
            : a,
        )
        assetIds.push(assetInput.assetId)
      }
    }

    // remove old draft assets that are no longer referenced
    const keepIds = new Set(assetIds)
    assets = assets.filter(a => {
      if (a.ownerType === 'draft' && a.ownerId === draftId && !keepIds.has(a.id)) {
        return false
      }
      return true
    })

    const draft: MemoryDraft = {
      id: draftId,
      spaceId: input.spaceId,
      entry: input.entry,
      text: input.text,
      assetIds,
      createdAt,
      updatedAt: now,
    }

    let drafts = snap.drafts
    if (existingIdx !== -1) {
      drafts = [...drafts]
      drafts[existingIdx] = draft
    } else {
      drafts = [...drafts, draft]
    }

    const candidate: MemorySnapshot = { ...snap, drafts, assets }
    const committed = await this.commit(candidate)
    return { value: cloneValue(draft), snapshot: committed }
  }

  async deleteDraft(draftId: string): Promise<MemorySnapshot> {
    const snap = this.ensureCurrent()
    if (!snap.drafts.find(d => d.id === draftId)) {
      throw new Error(`Draft not found: ${draftId}`)
    }

    const candidate: MemorySnapshot = {
      ...snap,
      drafts: snap.drafts.filter(d => d.id !== draftId),
      assets: snap.assets.filter(a => !(a.ownerType === 'draft' && a.ownerId === draftId)),
    }

    return this.commit(candidate)
  }

  async completeOnboarding(): Promise<MemorySnapshot> {
    const snap = this.ensureCurrent()
    const candidate: MemorySnapshot = { ...snap, hasCompletedOnboarding: true }
    return this.commit(candidate)
  }

  async resetSample(mode: SampleMode): Promise<MemorySnapshot> {
    const current = this.ensureCurrent()
    if (current.sampleMode !== mode) {
      await this.persistSnapshot(current)
    }

    const stored = await this.storage.get<MemorySnapshot>(makeSampleStorageKey(mode))
    const next = stored === null
      ? cloneValue(mode === 'empty' ? emptySnapshot : completeSnapshot)
      : await this.normalizeStoredSnapshot(stored)

    if (next.sampleMode !== mode) {
      throw new Error(`Stored sample mode mismatch: expected ${mode}, got ${next.sampleMode}`)
    }

    return this.commit(next)
  }

  // ---- private helpers ----

  private ensureCurrent(): MemorySnapshot {
    if (!this.current) {
      throw new Error('Repository not bootstrapped — call bootstrap() first')
    }
    return this.current
  }

  private async commit(candidate: MemorySnapshot): Promise<MemorySnapshot> {
    const result = validateSnapshot(candidate)
    if (result.kind !== 'valid') {
      const reason = result.kind === 'invalid' ? result.reason : result.kind
      throw new Error(`Candidate snapshot invalid: ${reason}`)
    }
    const committed = cloneValue(candidate)
    await this.persistSnapshot(committed)
    this.current = committed
    return cloneValue(committed)
  }

  private async bootstrapWithSnapshot(snapshot: MemorySnapshot): Promise<MemorySnapshot> {
    const committed = await this.persistSnapshot(snapshot)
    this.current = committed
    return cloneValue(committed)
  }

  private async normalizeStoredSnapshot(raw: MemorySnapshot): Promise<MemorySnapshot> {
    const result = validateSnapshot(raw)
    if (result.kind !== 'valid') {
      if (result.kind === 'unsupported-version') {
        throw new Error(`Unsupported snapshot version: ${result.version}. Current version: 1`)
      }
      throw new Error(`Stored snapshot is invalid: ${result.kind === 'invalid' ? result.reason : result.kind}`)
    }

    const normalized = normalizeLegacyCompleteSample(result.snapshot)
    const migrated = await this.migrateLegacySpaceCovers(normalized)
    return cloneValue(expireSessionAssets(migrated))
  }

  private async persistSnapshot(snapshot: MemorySnapshot): Promise<MemorySnapshot> {
    const committed = cloneValue(snapshot)
    await this.storage.set(makeSampleStorageKey(committed.sampleMode), cloneValue(committed))
    await this.storage.set(M0_ACTIVE_SAMPLE_MODE_KEY, committed.sampleMode)
    // Keep the original key as a compatibility mirror for existing M0 data and
    // older builds. It is never the source of truth once a mode snapshot exists.
    await this.storage.set(M0_SNAPSHOT_KEY, cloneValue(committed))
    return committed
  }

  private assetBelongsToSpace(asset: LocalAsset, spaceId: string, snap: MemorySnapshot): boolean {
    if (asset.ownerType === 'space' && asset.ownerId === spaceId) return true
    if (asset.ownerType === 'memory') {
      const mem = snap.memories.find(m => m.id === asset.ownerId)
      return mem !== undefined && mem.spaceId === spaceId
    }
    if (asset.ownerType === 'draft') {
      const draft = snap.drafts.find(d => d.id === asset.ownerId)
      return draft !== undefined && draft.spaceId === spaceId
    }
    return false
  }

  private async migrateLegacySpaceCovers(snapshot: MemorySnapshot): Promise<MemorySnapshot> {
    if (!this.photoFileStorage) return snapshot

    let migrated: MemorySnapshot | null = null
    for (const asset of snapshot.assets) {
      if (
        asset.ownerType !== 'space' ||
        asset.persistence !== 'session-only' ||
        asset.availability !== 'available'
      ) {
        continue
      }

      const space = snapshot.spaces.find(s => s.id === asset.ownerId && s.coverAssetId === asset.id)
      if (!space) continue

      try {
        const savedUri = await this.photoFileStorage.save(asset.uri)
        if (!savedUri) continue

        const base: MemorySnapshot = migrated ?? snapshot
        migrated = {
          ...base,
          assets: base.assets.map(candidate =>
            candidate.id === asset.id
              ? { ...candidate, uri: savedUri, persistence: 'local' as const }
              : candidate,
          ),
        }
      } catch {
        // A stale temporary path is handled by expireSessionAssets below.
      }
    }

    return migrated ?? snapshot
  }
}

function normalizeLegacyCompleteSample(snapshot: MemorySnapshot): MemorySnapshot {
  if (snapshot.sampleMode !== 'complete') return snapshot

  let changed = false
  const memories = snapshot.memories.map(memory => {
    const isLegacyFixtureMemory =
      memory.id === 'm_tuantu_photo1' &&
      memory.originalText === '第一次见到团团时，它正从纸箱里探出脑袋看着我。' &&
      memory.aiCandidateText === LEGACY_COMPLETE_SAMPLE_CANDIDATE

    if (!isLegacyFixtureMemory) return memory

    changed = true
    return { ...memory, aiCandidateText: null }
  })

  return changed ? { ...snapshot, memories } : snapshot
}
