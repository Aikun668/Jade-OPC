import type { AiDraftService } from './ai-draft-service'
import type { AiDraftResult, AiMockScenario, CreateAiDraftInput } from '../types/ai'

export type AiScenarioReader = () => AiMockScenario

const FIXED_CANDIDATE =
  '那天下午，阳光落在团团柔软的毛上。我们没有做什么，只是安静地坐在窗边，把那一小段温暖留在了彼此身边。'

export class MockAiDraftService implements AiDraftService {
  private _pending = false

  constructor(
    private readonly readScenario: AiScenarioReader,
    private readonly delayMs = 700,
  ) {}

  async createDraft(_input: CreateAiDraftInput): Promise<AiDraftResult> {
    if (this._pending) {
      throw new Error('已有正在进行的整理请求')
    }
    this._pending = true

    try {
      if (this.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs))
      }

      const scenario = this.readScenario()

      switch (scenario) {
        case 'success':
          return { kind: 'success', candidate: FIXED_CANDIDATE }
        case 'insufficient':
          return { kind: 'insufficient' }
        case 'unavailable':
          return { kind: 'unavailable' }
      }
    } finally {
      this._pending = false
    }
  }
}
