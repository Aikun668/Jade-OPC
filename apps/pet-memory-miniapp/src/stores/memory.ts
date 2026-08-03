import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
} from '../types/domain'
import { getRepository } from './deps'

export const useMemoryStore = defineStore('memory', () => {
  const spaces = ref<MemorySpace[]>([])
  const memories = ref<MemoryItem[]>([])
  const drafts = ref<MemoryDraft[]>([])
  const assets = ref<LocalAsset[]>([])

  // ---- internal ----

  function _commitSnapshot(snapshot: Pick<MemorySnapshot, 'spaces' | 'memories' | 'drafts' | 'assets'>): void {
    spaces.value = snapshot.spaces
    memories.value = snapshot.memories
    drafts.value = snapshot.drafts
    assets.value = snapshot.assets
  }

  // ---- actions ----

  async function createSpace(input: CreateSpaceInput): Promise<MemorySpace> {
    const repo = getRepository()
    const result = await repo.createSpace(input)
    _commitSnapshot(result.snapshot)
    return result.value
  }

  async function updateSpace(input: UpdateSpaceInput): Promise<void> {
    const repo = getRepository()
    const result = await repo.updateSpace(input)
    _commitSnapshot(result.snapshot)
  }

  async function deleteSpace(spaceId: string): Promise<void> {
    const repo = getRepository()
    const snapshot = await repo.deleteSpace(spaceId)
    _commitSnapshot(snapshot)
  }

  async function saveMemory(input: SaveMemoryInput): Promise<void> {
    const repo = getRepository()
    const result = await repo.saveMemory(input)
    _commitSnapshot(result.snapshot)
  }

  async function updateMemory(input: UpdateMemoryInput): Promise<void> {
    const repo = getRepository()
    const result = await repo.updateMemory(input)
    _commitSnapshot(result.snapshot)
  }

  async function deleteMemory(memoryId: string): Promise<void> {
    const repo = getRepository()
    const snapshot = await repo.deleteMemory(memoryId)
    _commitSnapshot(snapshot)
  }

  async function saveDraft(input: SaveDraftInput): Promise<void> {
    const repo = getRepository()
    const result = await repo.saveDraft(input)
    _commitSnapshot(result.snapshot)
  }

  async function deleteDraft(draftId: string): Promise<void> {
    const repo = getRepository()
    const snapshot = await repo.deleteDraft(draftId)
    _commitSnapshot(snapshot)
  }

  async function resetSample(mode: SampleMode): Promise<MemorySnapshot> {
    const repo = getRepository()
    const snapshot = await repo.resetSample(mode)
    _commitSnapshot(snapshot)
    return snapshot
  }

  // ---- getters ----

  const sortedSpaces = computed<MemorySpace[]>(() => {
    const lastMemoryTime = new Map<string, string>()

    for (const m of memories.value) {
      const existing = lastMemoryTime.get(m.spaceId)
      if (!existing || m.updatedAt > existing) {
        lastMemoryTime.set(m.spaceId, m.updatedAt)
      }
    }

    return [...spaces.value].sort((a, b) => {
      const aTime = lastMemoryTime.get(a.id) ?? a.updatedAt
      const bTime = lastMemoryTime.get(b.id) ?? b.updatedAt
      if (bTime !== aTime) return bTime.localeCompare(aTime)
      return a.name.localeCompare(b.name)
    })
  })

  function recentMemories(spaceId: string): MemoryItem[] {
    return [...memories.value]
      .filter(m => m.spaceId === spaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
  }

  function allMemories(spaceId: string): MemoryItem[] {
    return [...memories.value]
      .filter(m => m.spaceId === spaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function draftForSpace(spaceId: string): MemoryDraft | null {
    const match = drafts.value.find(d => d.spaceId === spaceId)
    return match ?? null
  }

  function findSpace(id: string): MemorySpace | null {
    return spaces.value.find(s => s.id === id) ?? null
  }

  function findMemory(id: string): MemoryItem | null {
    return memories.value.find(m => m.id === id) ?? null
  }

  function findAsset(id: string): LocalAsset | null {
    return assets.value.find(a => a.id === id) ?? null
  }

  function _reset(): void {
    spaces.value = []
    memories.value = []
    drafts.value = []
    assets.value = []
  }

  return {
    spaces,
    memories,
    drafts,
    assets,
    createSpace,
    updateSpace,
    deleteSpace,
    saveMemory,
    updateMemory,
    deleteMemory,
    saveDraft,
    deleteDraft,
    resetSample,
    sortedSpaces,
    recentMemories,
    allMemories,
    draftForSpace,
    findSpace,
    findMemory,
    findAsset,
    _commitSnapshot,
    _reset,
  }
})

export function _reset(): void {
  const store = useMemoryStore()
  store._reset()
}
