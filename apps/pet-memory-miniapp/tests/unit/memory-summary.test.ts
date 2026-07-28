import { describe, it, expect } from 'vitest'
import type { MemorySpace, MemoryItem, LocalAsset } from '../../src/types/domain'

// Import functions under test — they don't exist yet, so expect errors
import { buildSpaceSummary, buildMemoryEntry, formatDateLabel } from '../../src/features/memories/memory-summary'

function mkSpace(overrides: Partial<MemorySpace> = {}): MemorySpace {
  return {
    id: 'sp1',
    name: 'Test Pet',
    coverAssetId: null,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  }
}

function mkMemory(overrides: Partial<MemoryItem> = {}): MemoryItem {
  return {
    id: 'm1',
    spaceId: 'sp1',
    entry: 'daily',
    originalText: '今天天气很好。',
    aiCandidateText: null,
    assetIds: [],
    createdAt: '2026-04-15T14:00:00.000Z',
    updatedAt: '2026-04-15T14:00:00.000Z',
    ...overrides,
  }
}

function mkAsset(overrides: Partial<LocalAsset> = {}): LocalAsset {
  return {
    id: 'a1',
    ownerType: 'memory',
    ownerId: 'm1',
    uri: '/static/fixtures/photo.jpg',
    persistence: 'bundled',
    availability: 'available',
    order: 0,
    ...overrides,
  }
}

// =========================================================
// formatDateLabel
// =========================================================

describe('formatDateLabel', () => {
  it('formats ISO date to display label', () => {
    const result = formatDateLabel('2026-04-15T14:00:00.000Z')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('returns same label for same input', () => {
    expect(formatDateLabel('2026-04-15T14:00:00.000Z'))
      .toBe(formatDateLabel('2026-04-15T14:00:00.000Z'))
  })
})

// =========================================================
// buildSpaceSummary
// =========================================================

describe('buildSpaceSummary', () => {
  // T5A-M06: 摘要只取 originalText，不以 aiCandidateText 替代
  it('T5A-M06: uses originalText for latestSummary, not aiCandidateText', () => {
    const space = mkSpace()
    const memories = [
      mkMemory({ id: 'm1', originalText: '用户自己写的', aiCandidateText: 'AI生成的优化版', createdAt: '2026-04-15T14:00:00.000Z' }),
    ]
    const summary = buildSpaceSummary(space, memories, [])

    expect(summary.latestSummary).toBe('用户自己写的')
    expect(summary.latestSummary).not.toBe('AI生成的优化版')
  })

  // T5A-M06 edge: AI candidate present but originalText is used
  it('T5A-M06: ignores aiCandidateText even when present', () => {
    const space = mkSpace()
    const memories = [
      mkMemory({ id: 'm1', originalText: '原话', aiCandidateText: 'AI改写', createdAt: '2026-04-15T14:00:00.000Z' }),
    ]
    const summary = buildSpaceSummary(space, memories, [])
    expect(summary.latestSummary).toBe('原话')
  })

  // T5A-M07: 纯函数不自行截断或改写原话内容
  it('T5A-M07: does not truncate or rewrite original text', () => {
    const space = mkSpace()
    const longText = '这是一段比较长的文字，记录了今天和宠物在一起的每一个细节和感受。'
    const memories = [
      mkMemory({ id: 'm1', originalText: longText, createdAt: '2026-04-15T14:00:00.000Z' }),
    ]
    const summary = buildSpaceSummary(space, memories, [])
    expect(summary.latestSummary).toBe(longText)
  })

  // T5A-M08: 只有 available 且归属正确的资产能产生 thumbnailUri
  it('T5A-M08: uses first available correctly-owned asset as coverUri', () => {
    const space = mkSpace({ coverAssetId: 'a_cover' })
    const assets = [
      mkAsset({ id: 'a_cover', ownerType: 'space', ownerId: 'sp1', uri: '/static/fixtures/cover.jpg', availability: 'available', order: 0 }),
    ]
    const summary = buildSpaceSummary(space, [], assets)
    expect(summary.coverUri).toBe('/static/fixtures/cover.jpg')
  })

  // T5A-M09: 无可用照片时不保留空缩略图槽
  it('T5A-M09: no coverUri when cover asset is unavailable', () => {
    const space = mkSpace({ coverAssetId: 'a_cover' })
    const assets = [
      mkAsset({ id: 'a_cover', ownerType: 'space', ownerId: 'sp1', uri: '/static/fixtures/cover.jpg', availability: 'expired', order: 0 }),
    ]
    const summary = buildSpaceSummary(space, [], assets)
    expect(summary.coverUri).toBeUndefined()
  })

  it('T5A-M09: no coverUri when space has no coverAssetId', () => {
    const space = mkSpace({ coverAssetId: null })
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.coverUri).toBeUndefined()
  })

  // T5A-M10: 悬空、跨空间和 expired 资产不会输出破图 URI
  it('T5A-M10: expired asset does not produce coverUri', () => {
    const space = mkSpace({ coverAssetId: 'a_expired' })
    const assets = [
      mkAsset({ id: 'a_expired', ownerType: 'space', ownerId: 'sp1', uri: '/broken.jpg', availability: 'expired', order: 0 }),
    ]
    const summary = buildSpaceSummary(space, [], assets)
    expect(summary.coverUri).toBeUndefined()
  })

  it('T5A-M10: cross-space asset (wrong owner) does not produce coverUri', () => {
    const space = mkSpace({ coverAssetId: 'a_other' })
    const assets = [
      mkAsset({ id: 'a_other', ownerType: 'space', ownerId: 'sp2', uri: '/other.jpg', availability: 'available', order: 0 }),
    ]
    const summary = buildSpaceSummary(space, [], assets)
    expect(summary.coverUri).toBeUndefined()
  })

  it('T5A-M10: orphaned asset (not in assets list) does not produce coverUri', () => {
    const space = mkSpace({ coverAssetId: 'a_missing' })
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.coverUri).toBeUndefined()
  })

  // T5A-M11: 输入实体与数组不被修改
  it('T5A-M11: does not mutate input space', () => {
    const space = mkSpace()
    const original = JSON.stringify(space)
    buildSpaceSummary(space, [mkMemory()], [])
    expect(JSON.stringify(space)).toBe(original)
  })

  it('T5A-M11: does not mutate input memories array or its elements', () => {
    const memories = [mkMemory({ id: 'm1', originalText: 'hello' })]
    const original = JSON.stringify(memories)
    buildSpaceSummary(mkSpace(), memories, [])
    expect(JSON.stringify(memories)).toBe(original)
  })

  it('T5A-M11: does not mutate input assets array', () => {
    const assets = [mkAsset()]
    const original = JSON.stringify(assets)
    buildSpaceSummary(mkSpace(), [mkMemory()], assets)
    expect(JSON.stringify(assets)).toBe(original)
  })

  // T5A-M12: 同一固定输入重复调用结果一致
  it('T5A-M12: same input produces same output on repeated calls', () => {
    const space = mkSpace()
    const memories = [mkMemory({ id: 'm1', originalText: 'consistent', createdAt: '2026-04-15T14:00:00.000Z' })]
    const assets: LocalAsset[] = []

    const r1 = buildSpaceSummary(space, memories, assets)
    const r2 = buildSpaceSummary(space, memories, assets)

    expect(r1).toEqual(r2)
  })

  // hasMemories flag
  it('hasMemories: true when space has memories', () => {
    const space = mkSpace()
    const memories = [mkMemory({ id: 'm1', spaceId: 'sp1' })]
    const summary = buildSpaceSummary(space, memories, [])
    expect(summary.hasMemories).toBe(true)
  })

  it('hasMemories: false when space has no memories', () => {
    const space = mkSpace()
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.hasMemories).toBe(false)
  })

  // latestSummary uses most recent memory
  it('latestSummary comes from most recent memory', () => {
    const space = mkSpace()
    const memories = [
      mkMemory({ id: 'm1', originalText: 'older', createdAt: '2026-01-01T00:00:00.000Z' }),
      mkMemory({ id: 'm2', originalText: 'newer', createdAt: '2026-06-01T00:00:00.000Z' }),
    ]
    const summary = buildSpaceSummary(space, memories, [])
    expect(summary.latestSummary).toBe('newer')
  })

  // No memories
  it('latestSummary is undefined when no memories exist', () => {
    const space = mkSpace()
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.latestSummary).toBeUndefined()
  })

  // dateLabel from most recent memory
  it('dateLabel uses most recent memory date', () => {
    const space = mkSpace()
    const memories = [
      mkMemory({ id: 'm1', originalText: 'text', createdAt: '2026-04-15T14:00:00.000Z' }),
    ]
    const summary = buildSpaceSummary(space, memories, [])
    expect(summary.dateLabel).toBeTruthy()
  })

  it('dateLabel is undefined when no memories', () => {
    const space = mkSpace()
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.dateLabel).toBeUndefined()
  })

  // id and name preserved
  it('preserves space id and name', () => {
    const space = mkSpace({ id: 'my-id', name: 'My Pet' })
    const summary = buildSpaceSummary(space, [], [])
    expect(summary.id).toBe('my-id')
    expect(summary.name).toBe('My Pet')
  })

  // T5A-A02: 测试夹具不包含真实用户内容和本机照片路径
  it('T5A-A02: test fixtures use synthetic data only', () => {
    const space = mkSpace({ id: 'test-id', name: 'Test' })
    const memories = [mkMemory({ id: 'test-m1', originalText: 'synthetic text' })]
    const assets = [mkAsset({ id: 'test-a1', uri: '/static/fixtures/test.jpg' })]

    const summary = buildSpaceSummary(space, memories, assets)

    // No real names or paths
    expect(JSON.stringify(summary)).not.toMatch(/团团|豆豆|C:\\|D:\\|\/Users\/|\/home\//)
  })
})

// =========================================================
// buildMemoryEntry
// =========================================================

describe('buildMemoryEntry', () => {
  // T5A-M06: uses originalText
  it('T5A-M06: uses originalText for summary, not aiCandidateText', () => {
    const memory = mkMemory({ originalText: '用户原话', aiCandidateText: 'AI改写' })
    const entry = buildMemoryEntry(memory, [])
    expect(entry.summary).toBe('用户原话')
    expect(entry.summary).not.toBe('AI改写')
  })

  // T5A-M07: does not truncate
  it('T5A-M07: does not truncate longer text', () => {
    const longText = 'a'.repeat(500)
    const memory = mkMemory({ originalText: longText })
    const entry = buildMemoryEntry(memory, [])
    expect(entry.summary).toBe(longText)
  })

  // T5A-M08: only available + correct owner asset → thumbnailUri
  it('T5A-M08: uses first available memory asset as thumbnail', () => {
    const memory = mkMemory({ assetIds: ['a1', 'a2'] })
    const assets = [
      mkAsset({ id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/first.jpg', availability: 'available', order: 0 }),
      mkAsset({ id: 'a2', ownerType: 'memory', ownerId: 'm1', uri: '/second.jpg', availability: 'available', order: 1 }),
    ]
    const entry = buildMemoryEntry(memory, assets)
    expect(entry.thumbnailUri).toBe('/first.jpg')
  })

  // T5A-M10: expired photo → no thumbnail
  it('T5A-M10: expired asset does not produce thumbnailUri', () => {
    const memory = mkMemory({ assetIds: ['a1'] })
    const assets = [
      mkAsset({ id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/expired.jpg', availability: 'expired', order: 0 }),
    ]
    const entry = buildMemoryEntry(memory, assets)
    expect(entry.thumbnailUri).toBeUndefined()
  })

  // T5A-M10: cross-owner asset → no thumbnail
  it('T5A-M10: asset owned by different memory does not produce thumbnailUri', () => {
    const memory = mkMemory({ assetIds: ['a1'] })
    const assets = [
      mkAsset({ id: 'a1', ownerType: 'memory', ownerId: 'm2', uri: '/other.jpg', availability: 'available', order: 0 }),
    ]
    const entry = buildMemoryEntry(memory, assets)
    expect(entry.thumbnailUri).toBeUndefined()
  })

  // T5A-M10: asset owned by space (not memory) for a memory item's assetIds → no match
  it('T5A-M10: space-owned asset referenced by memory assetIds is not matched', () => {
    const memory = mkMemory({ assetIds: ['a1'] })
    const assets = [
      mkAsset({ id: 'a1', ownerType: 'space', ownerId: 'sp1', uri: '/space.jpg', availability: 'available', order: 0 }),
    ]
    const entry = buildMemoryEntry(memory, assets)
    expect(entry.thumbnailUri).toBeUndefined()
  })

  // No photos
  it('no thumbnailUri when memory has no assets', () => {
    const memory = mkMemory({ assetIds: [] })
    const entry = buildMemoryEntry(memory, [])
    expect(entry.thumbnailUri).toBeUndefined()
  })

  // dateLabel
  it('produces dateLabel from memory createdAt', () => {
    const memory = mkMemory({ createdAt: '2026-04-15T14:00:00.000Z' })
    const entry = buildMemoryEntry(memory, [])
    expect(entry.dateLabel).toBeTruthy()
    expect(typeof entry.dateLabel).toBe('string')
  })

  // id preserved
  it('preserves memory id', () => {
    const memory = mkMemory({ id: 'my-memory-id' })
    const entry = buildMemoryEntry(memory, [])
    expect(entry.id).toBe('my-memory-id')
  })

  // T5A-M11: no mutation
  it('T5A-M11: does not mutate input memory', () => {
    const memory = mkMemory()
    const original = JSON.stringify(memory)
    buildMemoryEntry(memory, [])
    expect(JSON.stringify(memory)).toBe(original)
  })

  it('T5A-M11: does not mutate input assets', () => {
    const assets = [mkAsset()]
    const original = JSON.stringify(assets)
    buildMemoryEntry(mkMemory(), assets)
    expect(JSON.stringify(assets)).toBe(original)
  })

  // T5A-M12: same input → same output
  it('T5A-M12: same input produces identical output', () => {
    const memory = mkMemory()
    const assets = [mkAsset()]
    expect(buildMemoryEntry(memory, assets)).toEqual(buildMemoryEntry(memory, assets))
  })

  // T5A-A02: synthetic fixtures
  it('T5A-A02: fixtures use synthetic data only', () => {
    const memory = mkMemory({ id: 'test-m', originalText: 'synthetic' })
    const assets = [mkAsset({ id: 'test-a', uri: '/static/fixtures/synthetic.jpg' })]
    const entry = buildMemoryEntry(memory, assets)

    expect(JSON.stringify(entry)).not.toMatch(/团团|豆豆|C:\\|D:\\|\/Users\/|\/home\//)
  })
})
