export type SampleMode = 'empty' | 'complete'

export type RecordEntry = 'daily' | 'photo' | 'meeting' | 'relationship'

export type AssetPersistence = 'session-only' | 'bundled'

export interface MemorySpace {
  id: string
  name: string
  coverAssetId: string | null
  createdAt: string
  updatedAt: string
}

export interface LocalAsset {
  id: string
  ownerType: 'space' | 'memory' | 'draft'
  ownerId: string
  uri: string
  persistence: AssetPersistence
  availability: 'available' | 'expired'
  order: number
}

export interface MemoryItem {
  id: string
  spaceId: string
  entry: RecordEntry
  originalText: string
  aiCandidateText: string | null
  assetIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoryDraft {
  id: string
  spaceId: string
  entry: RecordEntry
  text: string
  assetIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemorySnapshot {
  schemaVersion: 1
  sampleMode: SampleMode
  spaces: MemorySpace[]
  memories: MemoryItem[]
  drafts: MemoryDraft[]
  assets: LocalAsset[]
}

// ---- 写入输入类型 ----

export interface NewSessionAssetInput {
  uri: string
}

export type MemoryAssetInput =
  | { kind: 'existing'; assetId: string }
  | { kind: 'new'; asset: NewSessionAssetInput }

export interface CreateSpaceInput {
  name: string
  coverPhoto: NewSessionAssetInput | null
}

export interface UpdateSpaceInput {
  spaceId: string
  name: string
  coverPhotoChange:
    | { kind: 'keep' }
    | { kind: 'remove' }
    | { kind: 'replace'; photo: NewSessionAssetInput }
}

export interface SaveMemoryInput {
  spaceId: string
  entry: RecordEntry
  originalText: string
  assets: MemoryAssetInput[]
  sourceDraftId: string | null
}

export type UpdateMemoryInput =
  | { kind: 'original-text'; memoryId: string; originalText: string }
  | { kind: 'ai-candidate'; memoryId: string; aiCandidateText: string | null }

export interface SaveDraftInput {
  spaceId: string
  entry: RecordEntry
  text: string
  assets: MemoryAssetInput[]
}

export interface RepositoryWriteResult<T> {
  value: T
  snapshot: MemorySnapshot
}
