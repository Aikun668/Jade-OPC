import type { MemorySnapshot } from '../types/domain'

export const emptySnapshot: MemorySnapshot = {
  schemaVersion: 1,
  sampleMode: 'empty',
  hasCompletedOnboarding: false,
  spaces: [],
  memories: [],
  drafts: [],
  assets: [],
}
