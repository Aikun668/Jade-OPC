import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { MockAiDraftService } from '../../src/services/mock-ai-draft-service'
import type { AiMockScenario } from '../../src/types/ai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const EXPECTED_FIXED_CANDIDATE =
  '那天下午，阳光落在团团柔软的毛上。我们没有做什么，只是安静地坐在窗边，把那一小段温暖留在了彼此身边。'

function scenarioReader(initial: AiMockScenario) {
  let s = initial
  return {
    read: () => s,
    set: (v: AiMockScenario) => { s = v },
  }
}

describe('MockAiDraftService', () => {
  it('T8-S01: success scenario returns fixed candidate', async () => {
    const s = scenarioReader('success')
    const service = new MockAiDraftService(s.read, 0)
    const result = await service.createDraft({
      memoryId: 'm1',
      originalText: '那天下午，Ta 靠在窗边晒了很久的太阳……',
    })
    expect(result).toEqual({ kind: 'success', candidate: EXPECTED_FIXED_CANDIDATE })
  })

  it('T8-S02: insufficient scenario returns insufficient', async () => {
    const s = scenarioReader('insufficient')
    const service = new MockAiDraftService(s.read, 0)
    const result = await service.createDraft({
      memoryId: 'm1',
      originalText: '短文本',
    })
    expect(result).toEqual({ kind: 'insufficient' })
  })

  it('T8-S03: unavailable scenario returns unavailable', async () => {
    const s = scenarioReader('unavailable')
    const service = new MockAiDraftService(s.read, 0)
    const result = await service.createDraft({
      memoryId: 'm1',
      originalText: '原话内容',
    })
    expect(result).toEqual({ kind: 'unavailable' })
  })

  it('T8-S04: same scenario returns stable result across multiple calls', async () => {
    const s = scenarioReader('success')
    const service = new MockAiDraftService(s.read, 0)

    const r1 = await service.createDraft({ memoryId: 'm1', originalText: '文本 A' })
    const r2 = await service.createDraft({ memoryId: 'm2', originalText: '文本 B' })

    expect(r1).toEqual(r2)
    expect(r1).toEqual({ kind: 'success', candidate: EXPECTED_FIXED_CANDIDATE })
  })

  it('T8-S05: candidate text does not contain dynamic input (originalText or memoryId)', async () => {
    const s = scenarioReader('success')
    const service = new MockAiDraftService(s.read, 0)

    const r1 = await service.createDraft({ memoryId: 'm1', originalText: 'AAA' })
    const r2 = await service.createDraft({ memoryId: 'm2', originalText: 'BBB' })

    expect(r1).toEqual(r2)
    if (r1.kind === 'success' && r2.kind === 'success') {
      expect(r1.candidate).toBe(EXPECTED_FIXED_CANDIDATE)
      expect(r2.candidate).toBe(EXPECTED_FIXED_CANDIDATE)
      expect(r1.candidate).not.toContain('AAA')
      expect(r1.candidate).not.toContain('m1')
      expect(r2.candidate).not.toContain('BBB')
      expect(r2.candidate).not.toContain('m2')
    }
  })

  it('T8-S06: concurrent second request is rejected', async () => {
    const s = scenarioReader('success')
    const service = new MockAiDraftService(s.read, 100)

    const p1 = service.createDraft({ memoryId: 'm1', originalText: 'A' })
    const p2 = service.createDraft({ memoryId: 'm1', originalText: 'A' })

    const p2Error = p2.catch(e => e)
    await p1
    const err = await p2Error
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toContain('已有正在进行的整理请求')
  })

  it('T8-S07: sequential calls after first completes are allowed', async () => {
    const s = scenarioReader('success')
    const service = new MockAiDraftService(s.read, 0)

    await service.createDraft({ memoryId: 'm1', originalText: 'A' })
    const r2 = await service.createDraft({ memoryId: 'm2', originalText: 'B' })

    expect(r2).toEqual({ kind: 'success', candidate: EXPECTED_FIXED_CANDIDATE })
  })

  it('T8-S08: service does not import or depend on Pinia stores', () => {
    const src = readFileSync(
      join(__dirname, '../../src/services/mock-ai-draft-service.ts'),
      'utf-8',
    )
    expect(src).not.toMatch(/pinia|useStore|MemoryRepository|from.*stores|from.*repositories/)
  })

  it('T8-S09: service does not log, write to storage, or call external APIs', () => {
    const src = readFileSync(
      join(__dirname, '../../src/services/mock-ai-draft-service.ts'),
      'utf-8',
    )
    expect(src).not.toMatch(/console\.log|console\.warn|console\.error/)
    expect(src).not.toMatch(/uni\.(setStorage|getStorage|request)/)
    expect(src).not.toMatch(/fetch\(|axios|XMLHttpRequest/)
  })
})
