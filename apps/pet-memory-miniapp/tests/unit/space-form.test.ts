import { describe, it, expect } from 'vitest'
import { validateSpaceName } from '../../src/features/spaces/space-form'

describe('validateSpaceName', () => {
  describe('empty and whitespace', () => {
    it('rejects empty string', () => {
      const result = validateSpaceName('')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('empty')
        expect(result.message).toBe('先写下 Ta 的名字。')
      }
    })

    it('rejects spaces-only input', () => {
      const result = validateSpaceName('   ')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('empty')
      }
    })

    it('rejects tabs and newlines that trim to empty', () => {
      const result = validateSpaceName('\t \n')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('empty')
      }
    })
  })

  describe('trimming', () => {
    it('trims leading and trailing whitespace', () => {
      const result = validateSpaceName('  团团  ')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('团团')
      }
    })
  })

  describe('character limit (Unicode-aware)', () => {
    it('accepts exactly 20 CJK characters', () => {
      const name = '一二三四五六七八九十一二三四五六七八九十'
      expect([...name].length).toBe(20)
      const result = validateSpaceName(name)
      expect(result.ok).toBe(true)
    })

    it('rejects 21 CJK characters', () => {
      const name = '一二三四五六七八九十一二三四五六七八九十一'
      expect([...name].length).toBe(21)
      const result = validateSpaceName(name)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('too-long')
        expect(result.message).toBe('Ta 的名字最多写 20 个字。')
      }
    })

    it('counts Unicode characters, not bytes', () => {
      // "🐱🐶" is 2 characters, not counting surrogate pairs as 4
      const result = validateSpaceName('🐱🐶')
      expect(result.ok).toBe(true)
    })

    it('counts surrogate pair emoji as single character', () => {
      // Build a 21-emoji string: should be rejected
      const emoji = '🐱'.repeat(21)
      expect([...emoji].length).toBe(21)
      const result = validateSpaceName(emoji)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toBe('too-long')
    })

    it('20 emoji characters pass', () => {
      const emoji = '🐱'.repeat(20)
      const result = validateSpaceName(emoji)
      expect(result.ok).toBe(true)
    })
  })

  describe('mixed characters', () => {
    it('accepts Chinese with English mixed', () => {
      const result = validateSpaceName('Buddy小狗')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('Buddy小狗')
      }
    })

    it('accepts single CJK character', () => {
      const result = validateSpaceName('豆')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('豆')
      }
    })
  })

  describe('no extra restrictions', () => {
    it('does not restrict to particular language or script', () => {
      const result = validateSpaceName('Мишка')
      expect(result.ok).toBe(true)
    })

    it('does not restrict nicknames or species names', () => {
      const result = validateSpaceName('小灰灰')
      expect(result.ok).toBe(true)
    })
  })
})
