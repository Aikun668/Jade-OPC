export type AiMockScenario = 'success' | 'insufficient' | 'unavailable'

export interface CreateAiDraftInput {
  memoryId: string
  originalText: string
}

export type AiDraftResult =
  | { kind: 'success'; candidate: string }
  | { kind: 'insufficient' }
  | { kind: 'unavailable' }

export type AiDraftPageState =
  | 'authorization-required'
  | 'loading'
  | 'success'
  | 'insufficient'
  | 'unavailable'
  | 'save-pending'
  | 'save-error'
