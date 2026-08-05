import type { AiDraftResult, CreateAiDraftInput } from '../types/ai'

export interface AiDraftService {
  createDraft(input: CreateAiDraftInput): Promise<AiDraftResult>
}
