import { describe, it, expect } from 'vitest'
import {
  parseSpaceRoute,
  parseMemoryRoute,
  parseMemoryDetailRoute,
  parseTextRecordRoute,
  parsePhotoRecordRoute,
  parseSpaceSettingsRoute,
  parsePrivacyRoute,
} from '../../src/features/routing/route-params'
import type { RouteParseResult } from '../../src/types/routes'
import { isValidId, isValidEntry, MEMORY_DETAIL_SOURCES, VALID_ENTRIES, PRIVACY_SOURCES } from '../../src/types/routes'

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

// ---- parsePhotoRecordRoute ----

describe('parsePhotoRecordRoute', () => {
  it('valid spaceId returns valid result', () => {
    const result = parsePhotoRecordRoute({ spaceId: 's1' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value).toEqual({ spaceId: 's1' })
    }
  })

  it('missing spaceId returns missing-param', () => {
    const result = parsePhotoRecordRoute({})
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('missing-param')
      expect(result.param).toBe('spaceId')
    }
  })

  it('empty spaceId is rejected', () => {
    const result = parsePhotoRecordRoute({ spaceId: '' })
    expect(result.kind).toBe('invalid')
  })

  it('does not throw on missing param', () => {
    expect(() => parsePhotoRecordRoute({})).not.toThrow()
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

  it('T4A-M02: missing entry is valid (entry may come from draft)', () => {
    const result = parseTextRecordRoute({ spaceId: 's1' })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.value.spaceId).toBe('s1')
      expect(result.value.entry).toBeUndefined()
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

// ---- parseMemoryDetailRoute (Task 8) ----

describe('parseMemoryDetailRoute', () => {
  it('T8-M01: valid source=memories returns valid with source', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1', source: 'memories' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1', source: 'memories' },
    })
  })

  it('T8-M02: missing source defaults to space-home', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1', source: 'space-home' },
    })
  })

  it('T8-M03: invalid source returns invalid-source', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1', source: 'unknown' })
    expect(result).toEqual({
      kind: 'invalid',
      reason: 'invalid-source',
      param: 'source',
    })
  })

  it('T8-M04: missing memoryId returns missing-param', () => {
    const result = parseMemoryDetailRoute({})
    expect(result.kind).toBe('invalid')
    expect(result).toMatchObject({ kind: 'invalid', reason: 'missing-param', param: 'memoryId' })
  })

  it('T8-M05: empty memoryId is rejected', () => {
    const result = parseMemoryDetailRoute({ memoryId: '' })
    expect(result.kind).toBe('invalid')
  })

  it('T8-M06: valid source=space-home works', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1', source: 'space-home' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1', source: 'space-home' },
    })
  })

  it('T8-M07: valid source=new-memory works', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1', source: 'new-memory' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1', source: 'new-memory' },
    })
  })

  it('T8-M08: parser does not throw or access external state', () => {
    expect(() => parseMemoryDetailRoute({ memoryId: 'm1' })).not.toThrow()
    expect(() => parseMemoryDetailRoute({})).not.toThrow()
    expect(() => parseMemoryDetailRoute({ memoryId: 'm1', source: 'unknown' })).not.toThrow()
  })

  it('T8-M09: extra params do not enter result', () => {
    const result = parseMemoryDetailRoute({ memoryId: 'm1', source: 'memories', text: 'hello' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1', source: 'memories' },
    })
  })

  it('T8-M10: existing parseMemoryRoute is unchanged (backward compat)', () => {
    // parseMemoryRoute must NOT gain a source field
    const result = parseMemoryRoute({ memoryId: 'm1', source: 'memories' })
    expect(result).toEqual({
      kind: 'valid',
      value: { memoryId: 'm1' },
    })
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

// ---- PrivacySource (Task 9) ----

describe('PrivacySource', () => {
  it('T9-M01: PRIVACY_SOURCES only allows onboarding and settings', () => {
    expect(PRIVACY_SOURCES.has('onboarding')).toBe(true)
    expect(PRIVACY_SOURCES.has('settings')).toBe(true)
    expect(PRIVACY_SOURCES.size).toBe(2)
  })

  it('T9-M02: PRIVACY_SOURCES rejects unknown values', () => {
    expect(PRIVACY_SOURCES.has('unknown')).toBe(false)
    expect(PRIVACY_SOURCES.has('')).toBe(false)
    expect(PRIVACY_SOURCES.has('space-home')).toBe(false)
  })
})

// ---- parseSpaceSettingsRoute (Task 9) ----

describe('parseSpaceSettingsRoute', () => {
  it('T9-M03: valid spaceId returns valid result', () => {
    const result = parseSpaceSettingsRoute({ spaceId: 's1' })
    expect(result).toEqual({ kind: 'valid', value: { spaceId: 's1' } })
  })

  it('T9-M04: missing spaceId returns missing-param', () => {
    const result = parseSpaceSettingsRoute({})
    expect(result).toEqual({ kind: 'invalid', reason: 'missing-param', param: 'spaceId' })
  })

  it('T9-M05: empty string spaceId is rejected', () => {
    const result = parseSpaceSettingsRoute({ spaceId: '' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T9-M06: whitespace-only spaceId is rejected', () => {
    const result = parseSpaceSettingsRoute({ spaceId: '   ' })
    expect(result.kind).toBe('invalid')
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('invalid-id')
    }
  })

  it('T9-M07: object value for spaceId is rejected', () => {
    const result = parseSpaceSettingsRoute({ spaceId: { id: 's1' } })
    expect(result.kind).toBe('invalid')
  })

  it('T9-M08: parser does not check if entity exists', () => {
    const result = parseSpaceSettingsRoute({ spaceId: 'non-existent-space' })
    expect(result.kind).toBe('valid')
  })

  it('T9-M09: extra query params do not enter result', () => {
    const result = parseSpaceSettingsRoute({ spaceId: 's1', name: 'test' })
    expect(result).toEqual({ kind: 'valid', value: { spaceId: 's1' } })
  })

  it('T9-M10: function value for spaceId is rejected', () => {
    const result = parseSpaceSettingsRoute({ spaceId: () => 's1' })
    expect(result.kind).toBe('invalid')
  })
})

// ---- parsePrivacyRoute (Task 9) ----

describe('parsePrivacyRoute', () => {
  it('T9-M11: valid source=onboarding returns valid', () => {
    const result = parsePrivacyRoute({ source: 'onboarding' })
    expect(result).toEqual({ kind: 'valid', value: { source: 'onboarding' } })
  })

  it('T9-M12: valid source=settings returns valid', () => {
    const result = parsePrivacyRoute({ source: 'settings' })
    expect(result).toEqual({ kind: 'valid', value: { source: 'settings' } })
  })

  it('T9-M13: missing source returns missing-param', () => {
    const result = parsePrivacyRoute({})
    expect(result).toEqual({ kind: 'invalid', reason: 'missing-param', param: 'source' })
  })

  it('T9-M14: unknown source returns invalid-source', () => {
    const result = parsePrivacyRoute({ source: 'unknown' })
    expect(result).toEqual({ kind: 'invalid', reason: 'invalid-source', param: 'source' })
  })

  it('T9-M15: empty string source is rejected', () => {
    const result = parsePrivacyRoute({ source: '' })
    expect(result).toEqual({ kind: 'invalid', reason: 'invalid-source', param: 'source' })
  })

  it('T9-M16: parser does not check any external state', () => {
    expect(() => parsePrivacyRoute({ source: 'onboarding' })).not.toThrow()
    expect(() => parsePrivacyRoute({})).not.toThrow()
  })

  it('T9-M17: extra query params do not enter result', () => {
    const result = parsePrivacyRoute({ source: 'settings', spaceId: 's1' })
    expect(result).toEqual({ kind: 'valid', value: { source: 'settings' } })
  })

  it('T9-M18: object value for source is rejected', () => {
    const result = parsePrivacyRoute({ source: { name: 'onboarding' } })
    expect(result).toEqual({ kind: 'invalid', reason: 'invalid-source', param: 'source' })
  })
})
