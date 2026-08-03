import type { MemorySnapshot, RecordEntry, AssetPersistence, LocalAsset } from '../types/domain'

const CURRENT_SCHEMA_VERSION = 1

const VALID_ENTRIES: ReadonlySet<string> = new Set<RecordEntry>(['daily', 'photo', 'meeting', 'relationship'])

const VALID_PERSISTENCES: ReadonlySet<string> = new Set<AssetPersistence>(['session-only', 'bundled'])

const VALID_AVAILABILITIES: ReadonlySet<string> = new Set(['available', 'expired'])

const VALID_OWNER_TYPES: ReadonlySet<string> = new Set(['space', 'memory', 'draft'])

export type SnapshotReadResult =
  | { kind: 'valid'; snapshot: MemorySnapshot }
  | { kind: 'empty' }
  | { kind: 'unsupported-version'; version: number }
  | { kind: 'invalid'; reason: string }

export function validateSnapshot(value: unknown): SnapshotReadResult {
  if (value === null || value === undefined) {
    return { kind: 'empty' }
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { kind: 'invalid', reason: 'Snapshot must be an object' }
  }

  let obj = value as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number' || !Number.isInteger(obj.schemaVersion)) {
    return { kind: 'invalid', reason: 'schemaVersion must be an integer' }
  }

  if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { kind: 'unsupported-version', version: obj.schemaVersion }
  }

  if (obj.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return { kind: 'invalid', reason: `Unsupported schemaVersion: ${obj.schemaVersion}` }
  }

  // structural checks
  if (typeof obj.sampleMode !== 'string' || !['empty', 'complete'].includes(obj.sampleMode)) {
    return { kind: 'invalid', reason: 'sampleMode must be "empty" or "complete"' }
  }

  // Validate type only when key exists; defer default assignment until after spaces validation
  if ('hasCompletedOnboarding' in obj && typeof obj.hasCompletedOnboarding !== 'boolean') {
    return { kind: 'invalid', reason: 'hasCompletedOnboarding must be a boolean' }
  }

  if (!Array.isArray(obj.spaces)) return { kind: 'invalid', reason: 'spaces must be an array' }
  if (!Array.isArray(obj.memories)) return { kind: 'invalid', reason: 'memories must be an array' }
  if (!Array.isArray(obj.drafts)) return { kind: 'invalid', reason: 'drafts must be an array' }
  if (!Array.isArray(obj.assets)) return { kind: 'invalid', reason: 'assets must be an array' }

  const spaces = obj.spaces
  const memories = obj.memories
  const drafts = obj.drafts
  const assets = obj.assets

  // validate each entity shape + collect IDs
  const spaceIds = new Set<string>()
  for (let i = 0; i < spaces.length; i++) {
    const s = spaces[i]
    if (!isValidSpace(s, i)) {
      return { kind: 'invalid', reason: `Invalid space at index ${i}` }
    }
    if (spaceIds.has(s.id)) {
      return { kind: 'invalid', reason: `Duplicate space id: ${s.id}` }
    }
    spaceIds.add(s.id)
  }

  const memoryIds = new Set<string>()
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i]
    if (!isValidMemory(m, i)) {
      return { kind: 'invalid', reason: `Invalid memory at index ${i}` }
    }
    if (memoryIds.has(m.id)) {
      return { kind: 'invalid', reason: `Duplicate memory id: ${m.id}` }
    }
    if (!spaceIds.has(m.spaceId)) {
      return { kind: 'invalid', reason: `Memory ${m.id} references non-existent space ${m.spaceId}` }
    }
    memoryIds.add(m.id)
  }

  const draftSpaceIds = new Set<string>()
  const draftIds = new Set<string>()
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    if (!isValidDraft(d, i)) {
      return { kind: 'invalid', reason: `Invalid draft at index ${i}` }
    }
    if (draftIds.has(d.id)) {
      return { kind: 'invalid', reason: `Duplicate draft id: ${d.id}` }
    }
    if (!spaceIds.has(d.spaceId)) {
      return { kind: 'invalid', reason: `Draft ${d.id} references non-existent space ${d.spaceId}` }
    }
    if (draftSpaceIds.has(d.spaceId)) {
      return { kind: 'invalid', reason: `Space ${d.spaceId} has more than one draft` }
    }
    draftSpaceIds.add(d.spaceId)
    draftIds.add(d.id)
  }

  // validate assets
  const assetIds = new Set<string>()
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i]
    if (!isValidAsset(a, i)) {
      return { kind: 'invalid', reason: `Invalid asset at index ${i}` }
    }
    if (assetIds.has(a.id)) {
      return { kind: 'invalid', reason: `Duplicate asset id: ${a.id}` }
    }
    assetIds.add(a.id)

    // verify owner exists
    if (a.ownerType === 'space' && !spaceIds.has(a.ownerId)) {
      return { kind: 'invalid', reason: `Asset ${a.id}: owner space ${a.ownerId} does not exist` }
    }
    if (a.ownerType === 'memory' && !memoryIds.has(a.ownerId)) {
      return { kind: 'invalid', reason: `Asset ${a.id}: owner memory ${a.ownerId} does not exist` }
    }
    if (a.ownerType === 'draft' && !draftIds.has(a.ownerId)) {
      return { kind: 'invalid', reason: `Asset ${a.id}: owner draft ${a.ownerId} does not exist` }
    }
  }

  // validate assetIds references + ownership consistency
  const assetIdSet = new Set<string>(assetIds)

  // check memory assetIds
  for (const m of memories) {
    for (const assetId of m.assetIds) {
      if (!assetIdSet.has(assetId)) {
        return { kind: 'invalid', reason: `Memory ${m.id} references non-existent asset ${assetId}` }
      }
    }
  }

  // check draft assetIds
  for (const d of drafts) {
    for (const assetId of d.assetIds) {
      if (!assetIdSet.has(assetId)) {
        return { kind: 'invalid', reason: `Draft ${d.id} references non-existent asset ${assetId}` }
      }
    }
  }

  // check space coverAssetId references
  for (const s of spaces) {
    if (s.coverAssetId !== null && !assetIdSet.has(s.coverAssetId)) {
      return { kind: 'invalid', reason: `Space ${s.id} references non-existent cover asset ${s.coverAssetId}` }
    }
  }

  // ownership consistency: assets referenced via assetIds must have matching owner
  const assetMap = new Map<string, LocalAsset>()
  for (const a of assets) {
    assetMap.set(a.id, a)
  }

  for (const m of memories) {
    for (const assetId of m.assetIds) {
      const asset = assetMap.get(assetId)!
      if (asset.ownerType !== 'memory' || asset.ownerId !== m.id) {
        return { kind: 'invalid', reason: `Asset ${assetId} ownership mismatch: owned by ${asset.ownerType}/${asset.ownerId}, referenced by memory ${m.id}` }
      }
    }
  }

  for (const d of drafts) {
    for (const assetId of d.assetIds) {
      const asset = assetMap.get(assetId)!
      if (asset.ownerType !== 'draft' || asset.ownerId !== d.id) {
        return { kind: 'invalid', reason: `Asset ${assetId} ownership mismatch: owned by ${asset.ownerType}/${asset.ownerId}, referenced by draft ${d.id}` }
      }
    }
  }

  // space cover assets must be owned by space
  for (const s of spaces) {
    if (s.coverAssetId !== null) {
      const asset = assetMap.get(s.coverAssetId)!
      if (asset.ownerType !== 'space' || asset.ownerId !== s.id) {
        return { kind: 'invalid', reason: `Cover asset ${s.coverAssetId} ownership mismatch: owned by ${asset.ownerType}/${asset.ownerId}, expected space ${s.id}` }
      }
    }
  }

  // Normalize hasCompletedOnboarding based on spaces state (do NOT upgrade schemaVersion)
  if (!('hasCompletedOnboarding' in obj)) {
    // Old v1 snapshot: derive from spaces
    obj = { ...obj, hasCompletedOnboarding: spaces.length > 0 }
  } else if (obj.hasCompletedOnboarding === false && spaces.length > 0) {
    // Lossless repair: existing spaces but onboarding flag is false
    obj = { ...obj, hasCompletedOnboarding: true }
  }

  return { kind: 'valid', snapshot: obj as unknown as MemorySnapshot }
}

export function expireSessionAssets(snapshot: MemorySnapshot): MemorySnapshot {
  const assets = snapshot.assets.map((a) => {
    if (a.persistence === 'session-only') {
      return { ...a, availability: 'expired' as const }
    }
    return { ...a }
  })

  return {
    ...snapshot,
    assets,
  }
}

// ---- internal validators ----

function isValidSpace(s: unknown, _index: number): s is { id: string; name: string; coverAssetId: string | null; createdAt: string; updatedAt: string } {
  if (typeof s !== 'object' || s === null) return false
  const o = s as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.name === 'string' &&
    (o.coverAssetId === null || typeof o.coverAssetId === 'string') &&
    typeof o.createdAt === 'string' && o.createdAt.length > 0 &&
    typeof o.updatedAt === 'string' && o.updatedAt.length > 0
  )
}

function isValidMemory(m: unknown, _index: number): m is { id: string; spaceId: string; entry: RecordEntry; originalText: string; aiCandidateText: string | null; assetIds: string[]; createdAt: string; updatedAt: string } {
  if (typeof m !== 'object' || m === null) return false
  const o = m as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.spaceId === 'string' && o.spaceId.length > 0 &&
    typeof o.entry === 'string' && VALID_ENTRIES.has(o.entry) &&
    typeof o.originalText === 'string' &&
    (o.aiCandidateText === null || typeof o.aiCandidateText === 'string') &&
    Array.isArray(o.assetIds) && o.assetIds.every((id: unknown) => typeof id === 'string') &&
    typeof o.createdAt === 'string' && o.createdAt.length > 0 &&
    typeof o.updatedAt === 'string' && o.updatedAt.length > 0
  )
}

function isValidDraft(d: unknown, _index: number): d is { id: string; spaceId: string; entry: RecordEntry; text: string; assetIds: string[]; createdAt: string; updatedAt: string } {
  if (typeof d !== 'object' || d === null) return false
  const o = d as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.spaceId === 'string' && o.spaceId.length > 0 &&
    typeof o.entry === 'string' && VALID_ENTRIES.has(o.entry) &&
    typeof o.text === 'string' &&
    Array.isArray(o.assetIds) && o.assetIds.every((id: unknown) => typeof id === 'string') &&
    typeof o.createdAt === 'string' && o.createdAt.length > 0 &&
    typeof o.updatedAt === 'string' && o.updatedAt.length > 0
  )
}

function isValidAsset(a: unknown, _index: number): a is { id: string; ownerType: 'space' | 'memory' | 'draft'; ownerId: string; uri: string; persistence: AssetPersistence; availability: 'available' | 'expired'; order: number } {
  if (typeof a !== 'object' || a === null) return false
  const o = a as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.ownerType === 'string' && VALID_OWNER_TYPES.has(o.ownerType) &&
    typeof o.ownerId === 'string' && o.ownerId.length > 0 &&
    typeof o.uri === 'string' &&
    typeof o.persistence === 'string' && VALID_PERSISTENCES.has(o.persistence) &&
    typeof o.availability === 'string' && VALID_AVAILABILITIES.has(o.availability) &&
    typeof o.order === 'number' && Number.isInteger(o.order)
  )
}
