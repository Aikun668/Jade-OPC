import type {
  SampleMode,
  MemorySpace,
  MemoryItem,
  MemoryDraft,
  MemorySnapshot,
  CreateSpaceInput,
  UpdateSpaceInput,
  SaveMemoryInput,
  UpdateMemoryInput,
  SaveDraftInput,
  RepositoryWriteResult,
} from './domain'

export interface MemoryRepository {
  bootstrap(): Promise<MemorySnapshot>
  createSpace(input: CreateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>>
  updateSpace(input: UpdateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>>
  deleteSpace(spaceId: string): Promise<MemorySnapshot>
  saveMemory(input: SaveMemoryInput): Promise<RepositoryWriteResult<MemoryItem>>
  updateMemory(input: UpdateMemoryInput): Promise<RepositoryWriteResult<MemoryItem>>
  deleteMemory(memoryId: string): Promise<MemorySnapshot>
  saveDraft(input: SaveDraftInput): Promise<RepositoryWriteResult<MemoryDraft>>
  deleteDraft(draftId: string): Promise<MemorySnapshot>
  resetSample(mode: SampleMode): Promise<MemorySnapshot>
}
