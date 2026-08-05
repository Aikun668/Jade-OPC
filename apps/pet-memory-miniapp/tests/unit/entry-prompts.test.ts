import { describe, it, expect } from 'vitest'
import { TEXT_ENTRY_PROMPTS, isValidTextEntry, getPrompt } from '../../src/features/recording/entry-prompts'
import type { TextEntry } from '../../src/features/recording/entry-prompts'

describe('entry-prompts', () => {
  it('TEXT_ENTRY_PROMPTS has four entry keys (daily, photo, meeting, relationship)', () => {
    const keys = Object.keys(TEXT_ENTRY_PROMPTS)
    expect(keys).toHaveLength(4)
    expect(keys).toContain('daily')
    expect(keys).toContain('photo')
    expect(keys).toContain('meeting')
    expect(keys).toContain('relationship')
  })

  it('each prompt is a non-empty string', () => {
    for (const [key, prompt] of Object.entries(TEXT_ENTRY_PROMPTS)) {
      expect(typeof prompt).toBe('string')
      expect(prompt.trim().length).toBeGreaterThan(0)
    }
  })

  it('prompts match the confirmed copy text', () => {
    expect(TEXT_ENTRY_PROMPTS.daily).toBe('Ta 平时最喜欢待在哪个地方？')
    expect(TEXT_ENTRY_PROMPTS.photo).toBe('看到这张照片时，你最先想起了什么？')
    expect(TEXT_ENTRY_PROMPTS.meeting).toBe('还记得第一次见到 Ta 时，Ta 是什么样子吗？')
    expect(TEXT_ENTRY_PROMPTS.relationship).toBe('如果用一句话形容你和 Ta 的关系，会是什么？')
  })

  it('isValidTextEntry returns true for daily/photo/meeting/relationship', () => {
    expect(isValidTextEntry('daily')).toBe(true)
    expect(isValidTextEntry('photo')).toBe(true)
    expect(isValidTextEntry('meeting')).toBe(true)
    expect(isValidTextEntry('relationship')).toBe(true)
  })

  it('isValidTextEntry returns false for arbitrary strings', () => {
    expect(isValidTextEntry('')).toBe(false)
    expect(isValidTextEntry('unknown')).toBe(false)
    expect(isValidTextEntry('Daily')).toBe(false)
  })

  it('isValidTextEntry returns false for non-strings', () => {
    expect(isValidTextEntry(null)).toBe(false)
    expect(isValidTextEntry(undefined)).toBe(false)
    expect(isValidTextEntry(42)).toBe(false)
    expect(isValidTextEntry({})).toBe(false)
  })

  it('isValidTextEntry type guard narrows correctly', () => {
    const entry: unknown = 'daily'
    if (isValidTextEntry(entry)) {
      const _prompt: string = TEXT_ENTRY_PROMPTS[entry]
      expect(_prompt).toBeTruthy()
    } else {
      expect.fail('daily should pass isValidTextEntry')
    }
  })

  it('getPrompt returns correct prompt for valid entries', () => {
    expect(getPrompt('daily')).toBe(TEXT_ENTRY_PROMPTS.daily)
    expect(getPrompt('photo')).toBe(TEXT_ENTRY_PROMPTS.photo)
    expect(getPrompt('meeting')).toBe(TEXT_ENTRY_PROMPTS.meeting)
    expect(getPrompt('relationship')).toBe(TEXT_ENTRY_PROMPTS.relationship)
  })

  it('getPrompt throws for invalid entries', () => {
    expect(() => getPrompt('' as any)).toThrow()
    expect(() => getPrompt('unknown' as any)).toThrow()
  })
})
