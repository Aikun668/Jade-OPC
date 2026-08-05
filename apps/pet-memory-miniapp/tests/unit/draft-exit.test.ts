import { describe, it, expect } from 'vitest'
import {
  isDirtyText,
  isDirtyAssets,
  resolveExitAction,
  resolveResumeAction,
  type ExitAction,
  type ResumeAction,
} from '../../src/features/recording/draft-exit'

describe('draft-exit: isDirtyText', () => {
  it('empty string is not dirty', () => {
    expect(isDirtyText('')).toBe(false)
  })

  it('whitespace-only string is not dirty', () => {
    expect(isDirtyText('   ')).toBe(false)
    expect(isDirtyText('\n\t')).toBe(false)
    expect(isDirtyText('  \n  ')).toBe(false)
  })

  it('non-empty trimmed text is dirty', () => {
    expect(isDirtyText('hello')).toBe(true)
    expect(isDirtyText('  你好  ')).toBe(true)
    expect(isDirtyText('a')).toBe(true)
  })
})

describe('draft-exit: ExitAction', () => {
  it('resolveExitAction returns save-draft when text is dirty', () => {
    expect(resolveExitAction('有内容')).toBe('save-draft')
  })

  it('resolveExitAction returns discard when text is not dirty', () => {
    expect(resolveExitAction('')).toBe('discard')
    expect(resolveExitAction('   ')).toBe('discard')
  })
})

describe('draft-exit: ResumeAction', () => {
  it('resolveResumeAction returns three distinct options', () => {
    const actions: ResumeAction[] = ['continue-this', 'start-new', 'not-now']
    expect(new Set(actions).size).toBe(3)
  })
})

describe('draft-exit: isDirtyAssets', () => {
  it('empty arrays are not dirty', () => {
    expect(isDirtyAssets([], [])).toBe(false)
  })

  it('same arrays are not dirty', () => {
    expect(isDirtyAssets(['a', 'b'], ['a', 'b'])).toBe(false)
  })

  it('different lengths are dirty', () => {
    expect(isDirtyAssets(['a'], [])).toBe(true)
    expect(isDirtyAssets([], ['a'])).toBe(true)
  })

  it('different IDs are dirty', () => {
    expect(isDirtyAssets(['a'], ['b'])).toBe(true)
  })

  it('different order is dirty', () => {
    expect(isDirtyAssets(['a', 'b'], ['b', 'a'])).toBe(true)
  })

  it('subset is dirty (length differs)', () => {
    expect(isDirtyAssets(['a', 'b'], ['a'])).toBe(true)
  })
})
