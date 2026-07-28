import type { MemorySnapshot } from '../types/domain'

export const emptySnapshot: MemorySnapshot = {
  schemaVersion: 1,
  sampleMode: 'empty',
  spaces: [],
  memories: [],
  drafts: [],
  assets: [],
}
