import { describe, it, expect } from 'vitest'
import {
  parseSpaceRoute,
  parseMemoryRoute,
  parseTextRecordRoute,
} from '../../src/features/routing/route-params'
import type { RouteParseResult } from '../../src/types/routes'
import { isValidId, isValidEntry, MEMORY_DETAIL_SOURCES, VALID_ENTRIES } from '../../src/types/routes'

describe('Route types and constants', () => {
  it('T4A-M06: VALID_ENTRIES contains only daily/photo/meeting/relationship', () => {
    expect(VALID_ENTRIES.has('daily')).toBe(true)
    expect(VALID_ENTRIES.has('photo')).toBe(true)
    expect(VALID_ENTRIES.has('meeting')).toBe(true)
    expect(VALID_ENTRIES.has('relationship')).toBe(true)
    expect(VALID_ENTRIES.size).toBe(4)
  })

  it('T4A-M06: isValidEntry rejects unknown values', () => {
    expect(isValidEntry('daily')).toBe(true)
    expect(isValidEntry('photo')).toBe(true)
    expect(isValidEntry('unknown')).toBe(false)
    expect(isValidEntry('')).toBe(false)
    expect(isValidEntry(123)).toBe(false)
    expect(isValidEntry(null)).toBe(false)
    expect(isValidEntry(undefined)).toBe(false)
  })

  it('T4A-M04: isValidId uses project unified ID rules (non-empty string)', () => {
    expect(isValidId('abc123')).toBe(true)
    expect(isValidId('s1')).toBe(true)
    expect(isValidId('')).toBe(false)
    expect(isValidId('   ')).toBe(true) // non-empty string, whitespace is still a string
    expect(isValidId(123)).toBe(false)
    expect(isValidId(null)).toBe(false)
    expect(isValidId(undefined)).toBe(false)
    expect(isValidId({})).toBe(false)
    expect(isValidId([])).toBe(false)
  })

  it('T4A-M13: MEMORY_DETAIL_SOURCES only allows three whitelist values', () => {
    expect(MEMORY_DETAIL_SOURCES.has('space-home')).toBe(true)
    expect(MEMORY_DETAIL_SOURCES.has('memories')).toBe(true)
    expect(MEMORY_DETAIL_SOURCES.has('new-memory')).toBe(true)
    expect(MEMORY_DETAIL_SOURCES.size).toBe(3)
  })
})

// ---- parseSpaceRoute ----

describe('parseSpaceRoute', () => {
  it('T4A-M01: function exists with correct signature', () => {
    const result = parseSpaceRoute({ spaceId: 's1' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(typeof result.value.spaceId).toBe('string')
    }
  })

  it('T4A-M02: missing spaceId returns missing-param', () => {
    const result = parseSpaceRoute({})
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('spaceId')
    }
  })

  it('T4A-M02: does not throw on missing param', () => {
    expect(() => parseSpaceRoute({})).not.toThrow()
    expect(() => parseSpaceRoute({ foo: 'bar' })).not.toThrow()
  })

  it('T4A-M03: empty string spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: '' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
      expect(result.param).toBe('spaceId')
    }
  })

  it('T4A-M03: whitespace-only spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: '   ' })
    // whitespace-only is still a non-empty string per Task 3 validation
    // But the standard T4A-M03 says "空字符串、纯空格" are rejected
    // We implement stricter: reject whitespace-only as invalid-id
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M03: object value for spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: { id: 'x' } })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M03: array value for spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: ['s1'] })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M03: function value for spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: () => 's1' })
    expect(result.kind).toBe('invalid')
  })

  it('T4A-M03: number value for spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: 123 })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('boolean value for spaceId is rejected', () => {
    const result = parseSpaceRoute({ spaceId: true })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('valid spaceId returns valid result', () => {
    const result = parseSpaceRoute({ spaceId: 'space-abc-123' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 'space-abc-123' })
    }
  })

  it('T4A-M09: extra query params do not enter result', () => {
    const result = parseSpaceRoute({ spaceId: 's1', name: '团团', foo: 'bar' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 's1' })
    }
  })

  it('T4A-M10: URL-encoded objects cannot bypass whitelist', () => {
    // In uni-app, query params are already decoded strings
    const result = parseSpaceRoute({ spaceId: '{"id":"s1"}' })
    // This is technically a non-empty string, but it's not a valid ID
    // We should reject JSON-like values as invalid-id
    // Actually, per Task 3 rules, any non-empty string is a valid ID.
    // But T4A-M10 says we cannot bypass whitelist via URL-encoded JSON.
    // The key is: the function must validate the VALUE is a plain string,
    // not an object/array that was URL-decoded.
    // Since typeof string checks pass for JSON strings, we need a stricter check
    // that rejects JSON-looking strings as IDs.
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M11: parsing function does not throw or access external state', () => {
    // This is inherently tested by the fact that we can call it without
    // any Store, Repository, or platform setup
    expect(() => parseSpaceRoute({ spaceId: 's1' })).not.toThrow()
    expect(() => parseSpaceRoute({})).not.toThrow()
  })

  it('T4A-M12: parser does not check if entity exists', () => {
    // Non-existent space ID should still parse as valid
    const result = parseSpaceRoute({ spaceId: 'non-existent-space' })
    expect(result.kind).toBe('valid')
  })
})

// ---- parseMemoryRoute ----

describe('parseMemoryRoute', () => {
  it('T4A-M01: function exists with correct signature', () => {
    const result = parseMemoryRoute({ memoryId: 'm1' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(typeof result.value.memoryId).toBe('string')
    }
  })

  it('T4A-M02: missing memoryId returns missing-param', () => {
    const result = parseMemoryRoute({})
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('memoryId')
    }
  })

  it('T4A-M02: does not throw on missing param', () => {
    expect(() => parseMemoryRoute({})).not.toThrow()
    expect(() => parseMemoryRoute({ spaceId: 's1' })).not.toThrow()
  })

  it('T4A-M05: spaceId is not accepted as memoryId', () => {
    const result = parseMemoryRoute({ spaceId: 's1' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('memoryId')
    }
  })

  it('T4A-M03: empty string memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: '' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M03: whitespace-only memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: '   ' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T4A-M03: object value for memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: { id: 'm1' } })
    expect(result.kind).toBe('invalid')
  })

  it('T4A-M03: array value for memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: ['m1'] })
    expect(result.kind).toBe('invalid')
  })

  it('valid memoryId returns valid result', () => {
    const result = parseMemoryRoute({ memoryId: 'mem-xyz-789' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ memoryId: 'mem-xyz-789' })
    }
  })

  it('T4A-M09: extra query params do not enter result', () => {
    const result = parseMemoryRoute({ memoryId: 'm1', text: 'hello', photo: '/path/to/img' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ memoryId: 'm1' })
    }
  })

  it('T4A-M12: parser does not check if entity exists', () => {
    const result = parseMemoryRoute({ memoryId: 'non-existent-memory' })
    expect(result.kind).toBe('valid')
  })

  it('number value for memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: 123 })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('function value for memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: () => 'm1' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
    }
  })

  it('JSON-like string for memoryId is rejected', () => {
    const result = parseMemoryRoute({ memoryId: '{"id":"m1"}' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })
})

// ---- parseTextRecordRoute ----

describe('parseTextRecordRoute', () => {
  it('T4A-M01: function exists with correct signature', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'daily' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(typeof result.value.spaceId).toBe('string')
      expect(typeof result.value.entry).toBe('string')
    }
  })

  it('T4A-M02: missing spaceId returns missing-param', () => {
    const result = parseTextRecordRoute({ entry: 'daily' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('spaceId')
    }
  })

  it('T4A-M02: missing entry returns missing-param', () => {
    const result = parseTextRecordRoute({ spaceId: 's1' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('entry')
    }
  })

  it('T4A-M06: entry only accepts daily/photo/meeting/relationship', () => {
    expect((parseTextRecordRoute({ spaceId: 's1', entry: 'daily' })).kind).toBe('valid')
    expect((parseTextRecordRoute({ spaceId: 's1', entry: 'photo' })).kind).toBe('valid')
    expect((parseTextRecordRoute({ spaceId: 's1', entry: 'meeting' })).kind).toBe('valid')
    expect((parseTextRecordRoute({ spaceId: 's1', entry: 'relationship' })).kind).toBe('valid')
  })

  it('T4A-M07: case variants are not silently corrected', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'Daily' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-entry')
    }
  })

  it('T4A-M07: uppercase entry is rejected', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'DAILY' })
    expect(result.kind).toBe('invalid')
  })

  it('T4A-M07: entry with leading whitespace is not silently trimmed', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: ' daily' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-entry')
    }
  })

  it('T4A-M07: entry with trailing whitespace is not silently trimmed', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'daily ' })
    expect(result.kind).toBe('invalid')
  })

  it('T4A-M07: unknown entry is rejected with invalid-entry', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'unknown' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-entry')
      expect(result.param).toBe('entry')
    }
  })

  it('T4A-M08: entry=photo returns valid with only spaceId and entry', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: 'photo' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 's1', entry: 'photo' })
      expect(Object.keys(result.value)).toHaveLength(2)
    }
  })

  it('T4A-M08 & T4A-M16: entry=photo does not include photo URI or draft object', () => {
    const result = parseTextRecordRoute({
      spaceId: 's1',
      entry: 'photo',
      photoUri: '/path/to/photo',
      draftData: '{}',
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 's1', entry: 'photo' })
      expect((result.value as any).photoUri).toBeUndefined()
      expect((result.value as any).draftData).toBeUndefined()
    }
  })

  it('T4A-M09: extra query params (name, text, etc.) do not enter result', () => {
    const result = parseTextRecordRoute({
      spaceId: 's1',
      entry: 'daily',
      name: '团团',
      originalText: 'some memory text',
      photoPath: '/a/b/c',
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 's1', entry: 'daily' })
    }
  })

  it('T4A-M10: object value for entry cannot bypass whitelist', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: { name: 'daily' } })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-entry')
    }
  })

  it('T4A-M03: empty string entry is rejected', () => {
    const result = parseTextRecordRoute({ spaceId: 's1', entry: '' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-entry')
    }
  })

  it('T4A-M03: empty string spaceId is rejected', () => {
    const result = parseTextRecordRoute({ spaceId: '', entry: 'daily' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
      expect(result.param).toBe('spaceId')
    }
  })

  it('T4A-M11: parser does not throw or access external state', () => {
    expect(() => parseTextRecordRoute({ spaceId: 's1', entry: 'daily' })).not.toThrow()
    expect(() => parseTextRecordRoute({})).not.toThrow()
    expect(() => parseTextRecordRoute({ spaceId: 's1' })).not.toThrow()
  })

  it('T4A-M12: parser does not check if entity exists', () => {
    const result = parseTextRecordRoute({ spaceId: 'nonexistent', entry: 'daily' })
    expect(result.kind).toBe('valid')
  })

  it('discriminated union narrowing works for all result types', () => {
    function handleResult<T>(r: RouteParseResult<T>): string {
      switch (r.kind) {
        case 'valid':
          return `valid: ${JSON.stringify(r.value)}`
        case 'invalid':
          return `invalid: ${r.reason}/${r.param}`
      }
    }

    expect(handleResult(parseSpaceRoute({ spaceId: 's1' }))).toBe('valid: {"spaceId":"s1"}')
    expect(handleResult(parseSpaceRoute({}))).toBe('invalid: missing-param/spaceId')
    expect(handleResult(parseTextRecordRoute({ spaceId: 's1', entry: 'unknown' }))).toBe('invalid: invalid-entry/entry')
  })
})

// ---- MemoryDetailSource ----

describe('MemoryDetailSource', () => {
  it('T4A-M14: source values do not contain space name, original text, photos, or full return URLs', () => {
    const sources = Array.from(MEMORY_DETAIL_SOURCES)
    for (const s of sources) {
      expect(s).not.toContain('/')
      expect(s).not.toContain('?')
      expect(s).not.toContain('=')
      expect(s.length).toBeLessThan(30)
    }
  })

  it('T4A-M15: unknown sources handled by type system (no arbitrary string)', () => {
    // MemoryDetailSource is a string literal union - TypeScript will
    // reject arbitrary strings at compile time
    const valid: string[] = ['space-home', 'memories', 'new-memory']
    const invalid: string[] = ['arbitrary', 'unknown', '']
    for (const s of valid) {
      expect(MEMORY_DETAIL_SOURCES.has(s)).toBe(true)
    }
    for (const s of invalid) {
      expect(MEMORY_DETAIL_SOURCES.has(s)).toBe(false)
    }
  })
})
