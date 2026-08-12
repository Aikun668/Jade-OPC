import { describe, it, expect } from 'vitest'
import { validateSnapshot, expireSessionAssets } from '../../src/repositories/snapshot-validation'
import type { MemorySnapshot } from '../../src/types/domain'

function makeValidEmptySnapshot(): MemorySnapshot {
  return {
    schemaVersion: 1,
    sampleMode: 'empty',
    hasCompletedOnboarding: false,
    spaces: [],
    memories: [],
    drafts: [],
    assets: [],
  }
}

function makeValidCompleteSnapshot(): MemorySnapshot {
  return {
    schemaVersion: 1,
    sampleMode: 'complete',
    hasCompletedOnboarding: true,
    spaces: [
      { id: 's1', name: '团团', coverAssetId: 'a1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
      { id: 's2', name: '豆豆', coverAssetId: null, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    ],
    memories: [
      { id: 'm1', spaceId: 's1', entry: 'daily', originalText: '团团今天很开心', aiCandidateText: null, assetIds: [], createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
      { id: 'm2', spaceId: 's1', entry: 'photo', originalText: '', aiCandidateText: null, assetIds: ['a2'], createdAt: '2026-01-04T00:00:00Z', updatedAt: '2026-01-04T00:00:00Z' },
    ],
    drafts: [
      { id: 'd1', spaceId: 's1', entry: 'daily', text: '草稿...', assetIds: ['a3'], createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-05T00:00:00Z' },
    ],
    assets: [
      { id: 'a1', ownerType: 'space', ownerId: 's1', uri: '/bundled/cover.png', persistence: 'bundled', availability: 'available', order: 0 },
      { id: 'a2', ownerType: 'memory', ownerId: 'm2', uri: '/bundled/photo1.png', persistence: 'bundled', availability: 'available', order: 0 },
      { id: 'a3', ownerType: 'draft', ownerId: 'd1', uri: '/tmp/photo2.png', persistence: 'session-only', availability: 'available', order: 0 },
    ],
  }
}

describe('validateSnapshot', () => {
  // T3A-M01: null / no stored snapshot → kind: 'empty'
  it('returns empty for null input', () => {
    const result = validateSnapshot(null)
    expect(result).toEqual({ kind: 'empty' })
  })

  it('returns empty for undefined input', () => {
    const result = validateSnapshot(undefined)
    expect(result).toEqual({ kind: 'empty' })
  })

  // T3A-M02: schemaVersion 1 + all fields valid → kind: 'valid'
  it('returns valid for a legal empty snapshot', () => {
    const snapshot = makeValidEmptySnapshot()
    const result = validateSnapshot(snapshot)
    expect(result).toEqual({ kind: 'valid', snapshot })
  })

  it('returns valid for a legal complete snapshot', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = validateSnapshot(snapshot)
    expect(result).toEqual({ kind: 'valid', snapshot })
  })

  // T3A-M03: version > current → unsupported-version with real version number
  it('returns unsupported-version for schemaVersion 2', () => {
    const result = validateSnapshot({ schemaVersion: 2 })
    expect(result).toEqual({ kind: 'unsupported-version', version: 2 })
  })

  it('returns unsupported-version for schemaVersion 99', () => {
    const result = validateSnapshot({ schemaVersion: 99 })
    expect(result).toEqual({ kind: 'unsupported-version', version: 99 })
  })

  // T3A-M04: future version must not be converted to empty
  it('does not treat future version as empty', () => {
    const result = validateSnapshot({ schemaVersion: 5, spaces: [], memories: [], drafts: [], assets: [] })
    expect(result.kind).toBe('unsupported-version')
    expect(result).not.toHaveProperty('snapshot')
  })

  // T3A-M05: non-object, missing fields, array type errors → invalid
  it('returns invalid for non-object input (string)', () => {
    const result = validateSnapshot('not-an-object')
    expect(result).toEqual({ kind: 'invalid', reason: expect.stringContaining('object') })
  })

  it('returns invalid for non-object input (number)', () => {
    const result = validateSnapshot(42)
    expect(result.kind).toBe('invalid')
  })

  it('returns invalid for non-object input (array)', () => {
    const result = validateSnapshot([1, 2, 3])
    expect(result.kind).toBe('invalid')
  })

  it('returns invalid when spaces is missing', () => {
    const result = validateSnapshot({ schemaVersion: 1, memories: [], drafts: [], assets: [] })
    expect(result.kind).toBe('invalid')
  })

  it('returns invalid when memories is not an array', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [],
      memories: 'not-array',
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('invalid')
  })

  it('returns invalid when drafts is not an array', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [],
      memories: [],
      drafts: {},
      assets: [],
    })
    expect(result.kind).toBe('invalid')
  })

  it('returns invalid when assets is not an array', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [],
      memories: [],
      drafts: [],
      assets: null,
    })
    expect(result.kind).toBe('invalid')
  })

  // T3A-M06: duplicate IDs within each collection rejected
  it('rejects duplicate space IDs', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [
      { id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 's1', name: 'B', coverAssetId: null, createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects duplicate memory IDs', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.memories = [
      { id: 'm1', spaceId: 's1', entry: 'daily', originalText: 'a', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'm1', spaceId: 's1', entry: 'daily', originalText: 'b', aiCandidateText: null, assetIds: [], createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects duplicate draft IDs', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.drafts = [
      { id: 'd1', spaceId: 's1', entry: 'daily', text: 'a', assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'd1', spaceId: 's1', entry: 'daily', text: 'b', assetIds: [], createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects duplicate asset IDs', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.assets = [
      { id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/a.png', persistence: 'bundled', availability: 'available', order: 0 },
      { id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/b.png', persistence: 'bundled', availability: 'available', order: 1 },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  // T3A-M07: memory or draft referencing non-existent spaceId
  it('rejects memory with dangling spaceId', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.memories = [
      { id: 'm1', spaceId: 'nonexistent', entry: 'daily', originalText: 'x', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects draft with dangling spaceId', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.drafts = [
      { id: 'd1', spaceId: 'ghost', entry: 'daily', text: 'x', assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  // T3A-M08: same space having two drafts rejected
  it('rejects two drafts in the same space', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.drafts = [
      { id: 'd1', spaceId: 's1', entry: 'daily', text: 'a', assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'd2', spaceId: 's1', entry: 'meeting', text: 'b', assetIds: [], createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  // T3A-M09: dangling assetIds references, duplicate references, or wrong ownership
  it('rejects memory referencing non-existent asset', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.memories = [
      { id: 'm1', spaceId: 's1', entry: 'daily', originalText: 'x', aiCandidateText: null, assetIds: ['ghost'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects duplicate asset references in one memory', () => {
    const snapshot = makeValidCompleteSnapshot()
    snapshot.memories[1].assetIds = ['a2', 'a2']

    expect(validateSnapshot(snapshot).kind).toBe('invalid')
  })

  it('rejects duplicate asset references in one draft', () => {
    const snapshot = makeValidCompleteSnapshot()
    snapshot.drafts[0].assetIds = ['a3', 'a3']

    expect(validateSnapshot(snapshot).kind).toBe('invalid')
  })

  it('rejects asset with ownerType/ownerId mismatch (memory asset pointing to space)', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: 'a1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.memories = [
      { id: 'm1', spaceId: 's1', entry: 'daily', originalText: 'x', aiCandidateText: null, assetIds: ['a1'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    snapshot.assets = [
      { id: 'a1', ownerType: 'space', ownerId: 's1', uri: '/cover.png', persistence: 'bundled', availability: 'available', order: 0 },
    ]
    // memory references asset a1 via assetIds, but a1 is owned by space → wrong ownership
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects asset with non-existent owner', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.assets = [
      { id: 'a1', ownerType: 'memory', ownerId: 'm999', uri: '/a.png', persistence: 'bundled', availability: 'available', order: 0 },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  // T3A-M10: illegal entry, asset persistence, availability, owner type rejected
  it('rejects invalid RecordEntry value', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [{ id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]
    snapshot.memories = [
      { id: 'm1', spaceId: 's1', entry: 'invalid-entry' as any, originalText: 'x', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects invalid AssetPersistence value', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.assets = [
      { id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/a.png', persistence: 'permanent' as any, availability: 'available', order: 0 },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects invalid availability value', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.assets = [
      { id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/a.png', persistence: 'bundled', availability: 'deleted' as any, order: 0 },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })

  it('rejects invalid ownerType value', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.assets = [
      { id: 'a1', ownerType: 'store' as any, ownerId: 'x', uri: '/a.png', persistence: 'bundled', availability: 'available', order: 0 },
    ]
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('invalid')
  })
})

describe('expireSessionAssets', () => {
  // T3A-M11: only session-only assets are converted to expired
  it('converts session-only assets to expired', () => {
    const snapshot = makeValidCompleteSnapshot()
    // a3 is session-only
    const result = expireSessionAssets(snapshot)
    const a3 = result.assets.find(a => a.id === 'a3')!
    expect(a3.availability).toBe('expired')
  })

  // T3A-M12: bundled assets stay available; other entity content not rewritten
  it('keeps bundled assets available', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    const a1 = result.assets.find(a => a.id === 'a1')!
    expect(a1.availability).toBe('available')
  })

  it('does not change spaces', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    expect(result.spaces).toEqual(snapshot.spaces)
  })

  it('does not change memories', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    expect(result.memories).toEqual(snapshot.memories)
  })

  it('does not change drafts', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    expect(result.drafts).toEqual(snapshot.drafts)
  })

  it('does not change sampleMode or schemaVersion', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    expect(result.schemaVersion).toBe(snapshot.schemaVersion)
    expect(result.sampleMode).toBe(snapshot.sampleMode)
  })

  // T3A-M13: functions don't mutate input objects
  it('does not mutate the input snapshot', () => {
    const snapshot = makeValidCompleteSnapshot()
    const frozen = JSON.stringify(snapshot)
    expireSessionAssets(snapshot)
    expect(JSON.stringify(snapshot)).toBe(frozen)
  })

  it('returns a new object (not same reference)', () => {
    const snapshot = makeValidCompleteSnapshot()
    const result = expireSessionAssets(snapshot)
    expect(result).not.toBe(snapshot)
  })
})

describe('hasCompletedOnboarding normalization (old v1 snapshots)', () => {
  it('old v1 without field + no spaces → defaults to false', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      spaces: [],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.hasCompletedOnboarding).toBe(false)
    }
  })

  it('old v1 without field + has spaces → defaults to true', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      spaces: [{ id: 's1', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.hasCompletedOnboarding).toBe(true)
    }
  })

  it('existing false + has spaces → losslessly repairs to true', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [{ id: 's1', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.hasCompletedOnboarding).toBe(true)
    }
  })

  it('existing true + no spaces → keeps true', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: true,
      spaces: [],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.hasCompletedOnboarding).toBe(true)
    }
  })

  it('does not upgrade schemaVersion during normalization', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [{ id: 's1', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.schemaVersion).toBe(1)
    }
  })

  it('preserves original spaces, memories, drafts, assets during normalization', () => {
    const snapshot = {
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
      spaces: [{ id: 's1', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      memories: [{ id: 'm1', spaceId: 's1', entry: 'daily', originalText: 'hello', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      drafts: [],
      assets: [{ id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/photo.png', persistence: 'bundled', availability: 'available', order: 0 }],
    }
    const result = validateSnapshot(snapshot)
    expect(result.kind).toBe('valid')
    if (result.kind === 'valid') {
      expect(result.snapshot.spaces).toEqual(snapshot.spaces)
      expect(result.snapshot.memories).toEqual(snapshot.memories)
      expect(result.snapshot.drafts).toEqual(snapshot.drafts)
      expect(result.snapshot.assets).toEqual(snapshot.assets)
    }
  })

  it('rejects hasCompletedOnboarding when key exists but type is wrong', () => {
    const result = validateSnapshot({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: 'yes',
      spaces: [],
      memories: [],
      drafts: [],
      assets: [],
    })
    expect(result.kind).toBe('invalid')
  })
})

describe('validateSnapshot immutability', () => {
  it('does not mutate the input object on validation failure', () => {
    const snapshot = makeValidEmptySnapshot()
    snapshot.spaces = [
      { id: 's1', name: 'A', coverAssetId: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 's1', name: 'B', coverAssetId: null, createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]
    const frozen = JSON.stringify(snapshot)
    validateSnapshot(snapshot)
    expect(JSON.stringify(snapshot)).toBe(frozen)
  })
})
