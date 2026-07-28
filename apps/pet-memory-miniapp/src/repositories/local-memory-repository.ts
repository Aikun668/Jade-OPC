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
import type { Clock } from '../utils/dates'
import type { IdFactory } from '../utils/ids'
import { validateSnapshot, expireSessionAssets } from './snapshot-validation'
import { emptySnapshot } from '../fixtures/empty-snapshot'
import { completeSnapshot } from '../fixtures/complete-snapshot'

export const M0_SNAPSHOT_KEY = 'pet-memory:m0:snapshot'

export class LocalMemoryRepository implements MemoryRepository {
  private current: MemorySnapshot | null = null

  constructor(
    private storage: StorageAdapter,
    private clock: Clock,
    private idFactory: IdFactory,
  ) {}

  async bootstrap(): Promise<MemorySnapshot> {
    const raw = await this.storage.get<MemorySnapshot>(M0_SNAPSHOT_KEY)
    if (raw === null) {
      const validated = validateSnapshot(emptySnapshot)
      if (validated.kind !== 'valid') {
        throw new Error('Empty snapshot fixture is invalid')
      }
      await this.storage.set(M0_SNAPSHOT_KEY, emptySnapshot)
      this.current = emptySnapshot
      return emptySnapshot
    }

    const result = validateSnapshot(raw)
    if (result.kind === 'valid') {
      const expired = expireSessionAssets(result.snapshot)
      this.current = expired
      return expired
    }

    if (result.kind === 'unsupported-version') {
      throw new Error(`Unsupported snapshot version: ${result.version}. Current version: 1`)
    }

    throw new Error(`Stored snapshot is invalid: ${result.kind === 'invalid' ? result.reason : result.kind}`)
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
        persistence: 'session-only',
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
    return { value: space, snapshot: committed }
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
        persistence: 'session-only',
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
    return { value: updatedSpace, snapshot: committed }
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
      // count existing assets from draft
      const draftExistingAssets = input.assets.filter(a => a.kind === 'existing')
      // all existing assets in the input should reference draft assets
      const draftAssetIds = new Set(sourceDraft.assetIds)
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
    return { value: memory, snapshot: committed }
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
      updatedMemory = { ...oldMemory, originalText: input.originalText, updatedAt: now }
    } else {
      updatedMemory = { ...oldMemory, aiCandidateText: input.aiCandidateText, updatedAt: now }
    }

    const memories = [...snap.memories]
    memories[idx] = updatedMemory

    const candidate: MemorySnapshot = { ...snap, memories }
    const committed = await this.commit(candidate)
    return { value: updatedMemory, snapshot: committed }
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
    return { value: draft, snapshot: committed }
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

  async resetSample(mode: SampleMode): Promise<MemorySnapshot> {
    const fixture = mode === 'empty' ? emptySnapshot : completeSnapshot
    return this.commit(fixture)
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
    await this.storage.set(M0_SNAPSHOT_KEY, candidate)
    this.current = candidate
    return candidate
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
}
