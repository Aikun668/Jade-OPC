import type { AiDraftService } from './ai-draft-service'

let _service: AiDraftService | null = null

export function provideAiDraftService(service: AiDraftService): void {
  _service = service
}

export function getAiDraftService(): AiDraftService {
  if (!_service) {
    throw new Error('AiDraftService not provided — call provideAiDraftService() during app setup')
  }
  return _service
}

export function _resetAiDraftService(): void {
  _service = null
}
