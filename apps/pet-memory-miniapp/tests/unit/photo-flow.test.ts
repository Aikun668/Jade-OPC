import { describe, it, expect } from 'vitest'
import {
  MAX_PHOTOS,
  remainingPhotoSlots,
  appendPickedPhotos,
  removeSelectedPhoto,
  toMemoryAssetInputs,
  hasPhotoChanges,
  type SelectedPhoto,
} from '../../src/features/recording/photo-flow'
import type { PickedPhoto } from '../../src/adapters/photo-picker'

function makePicked(uri: string): PickedPhoto {
  return { uri, width: 100, height: 100 }
}

function makeNew(uri: string): SelectedPhoto {
  return { kind: 'new', photo: makePicked(uri) }
}

function makeExisting(assetId: string): SelectedPhoto {
  return { kind: 'existing', assetId }
}

describe('MAX_PHOTOS', () => {
  it('equals 9', () => {
    expect(MAX_PHOTOS).toBe(9)
  })
})

describe('remainingPhotoSlots', () => {
  it('returns 9 when empty', () => {
    expect(remainingPhotoSlots([])).toBe(9)
  })

  it('returns correct remaining when partially filled', () => {
    const selected: SelectedPhoto[] = [makeNew('a'), makeNew('b'), makeNew('c')]
    expect(remainingPhotoSlots(selected)).toBe(6)
  })

  it('returns 0 when full', () => {
    const selected: SelectedPhoto[] = Array.from({ length: 9 }, (_, i) => makeNew(`p${i}`))
    expect(remainingPhotoSlots(selected)).toBe(0)
  })

  it('returns 0 when over capacity (defensive)', () => {
    const selected: SelectedPhoto[] = Array.from({ length: 10 }, (_, i) => makeNew(`p${i}`))
    expect(remainingPhotoSlots(selected)).toBe(0)
  })
})

describe('appendPickedPhotos', () => {
  it('appends picked photos to empty selection', () => {
    const picked = [makePicked('a'), makePicked('b')]
    const result = appendPickedPhotos([], picked)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.selected).toHaveLength(2)
      expect(result.selected[0]).toEqual({ kind: 'new', photo: picked[0] })
      expect(result.selected[1]).toEqual({ kind: 'new', photo: picked[1] })
    }
  })

  it('appends to existing selection', () => {
    const existing: SelectedPhoto[] = [makeNew('x')]
    const picked = [makePicked('y')]
    const result = appendPickedPhotos(existing, picked)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.selected).toHaveLength(2)
    }
  })

  it('returns limit-exceeded when picked exceeds remaining slots', () => {
    const existing: SelectedPhoto[] = Array.from({ length: 8 }, (_, i) => makeNew(`p${i}`))
    const picked = [makePicked('a'), makePicked('b')]
    const result = appendPickedPhotos(existing, picked)
    expect(result.kind).toBe('limit-exceeded')
  })

  it('allows picking exactly to the limit', () => {
    const existing: SelectedPhoto[] = Array.from({ length: 7 }, (_, i) => makeNew(`p${i}`))
    const picked = [makePicked('a'), makePicked('b')]
    const result = appendPickedPhotos(existing, picked)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.selected).toHaveLength(9)
    }
  })

  it('does not mutate original array', () => {
    const existing: SelectedPhoto[] = [makeNew('x')]
    const originalLength = existing.length
    appendPickedPhotos(existing, [makePicked('y')])
    expect(existing).toHaveLength(originalLength)
  })

  it('preserves order: existing first, then new in pick order', () => {
    const existing: SelectedPhoto[] = [makeNew('first'), makeExisting('e1')]
    const picked = [makePicked('second'), makePicked('third')]
    const result = appendPickedPhotos(existing, picked)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.selected).toHaveLength(4)
      expect((result.selected[0] as any).photo?.uri).toBe('first')
      expect((result.selected[1] as any).assetId).toBe('e1')
      expect((result.selected[2] as any).photo?.uri).toBe('second')
      expect((result.selected[3] as any).photo?.uri).toBe('third')
    }
  })
})

describe('removeSelectedPhoto', () => {
  it('removes photo at valid index', () => {
    const selected: SelectedPhoto[] = [makeNew('a'), makeNew('b'), makeNew('c')]
    const result = removeSelectedPhoto(selected, 1)
    expect(result).toHaveLength(2)
    expect((result[0] as any).photo?.uri).toBe('a')
    expect((result[1] as any).photo?.uri).toBe('c')
  })

  it('removes first photo', () => {
    const selected: SelectedPhoto[] = [makeNew('a'), makeNew('b')]
    const result = removeSelectedPhoto(selected, 0)
    expect(result).toHaveLength(1)
    expect((result[0] as any).photo?.uri).toBe('b')
  })

  it('removes last photo', () => {
    const selected: SelectedPhoto[] = [makeNew('a'), makeNew('b')]
    const result = removeSelectedPhoto(selected, 1)
    expect(result).toHaveLength(1)
    expect((result[0] as any).photo?.uri).toBe('a')
  })

  it('returns copy when index is out of bounds (negative)', () => {
    const selected: SelectedPhoto[] = [makeNew('a')]
    const result = removeSelectedPhoto(selected, -1)
    expect(result).toHaveLength(1)
    expect(result).not.toBe(selected)
  })

  it('returns copy when index is out of bounds (too large)', () => {
    const selected: SelectedPhoto[] = [makeNew('a')]
    const result = removeSelectedPhoto(selected, 5)
    expect(result).toHaveLength(1)
  })

  it('does not mutate original array', () => {
    const selected: SelectedPhoto[] = [makeNew('a'), makeNew('b')]
    removeSelectedPhoto(selected, 0)
    expect(selected).toHaveLength(2)
  })
})

describe('toMemoryAssetInputs', () => {
  it('converts new photos to new asset inputs', () => {
    const selected: SelectedPhoto[] = [makeNew('/path/a'), makeNew('/path/b')]
    const result = toMemoryAssetInputs(selected)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ kind: 'new', asset: { uri: '/path/a' } })
    expect(result[1]).toEqual({ kind: 'new', asset: { uri: '/path/b' } })
  })

  it('converts existing photos to existing asset inputs', () => {
    const selected: SelectedPhoto[] = [makeExisting('asset-1'), makeExisting('asset-2')]
    const result = toMemoryAssetInputs(selected)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ kind: 'existing', assetId: 'asset-1' })
    expect(result[1]).toEqual({ kind: 'existing', assetId: 'asset-2' })
  })

  it('converts mixed new and existing', () => {
    const selected: SelectedPhoto[] = [makeNew('/new'), makeExisting('old')]
    const result = toMemoryAssetInputs(selected)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ kind: 'new', asset: { uri: '/new' } })
    expect(result[1]).toEqual({ kind: 'existing', assetId: 'old' })
  })

  it('returns empty array for empty selection', () => {
    expect(toMemoryAssetInputs([])).toEqual([])
  })
})

describe('hasPhotoChanges', () => {
  it('returns false when both empty', () => {
    expect(hasPhotoChanges([], [])).toBe(false)
  })

  it('returns true when length differs', () => {
    expect(hasPhotoChanges(['a'], [])).toBe(true)
    expect(hasPhotoChanges([], [makeExisting('a')])).toBe(true)
  })

  it('returns true when any selected photo is new', () => {
    const selected: SelectedPhoto[] = [makeNew('new-uri')]
    expect(hasPhotoChanges([], selected)).toBe(true)
  })

  it('returns true when existing IDs differ', () => {
    expect(hasPhotoChanges(['a'], [makeExisting('b')])).toBe(true)
  })

  it('returns true when existing IDs are in different order', () => {
    expect(hasPhotoChanges(['a', 'b'], [makeExisting('b'), makeExisting('a')])).toBe(true)
  })

  it('returns false when existing IDs match exactly', () => {
    expect(hasPhotoChanges(['a', 'b'], [makeExisting('a'), makeExisting('b')])).toBe(false)
  })

  it('returns true when mixed new and existing differ from initial', () => {
    const selected: SelectedPhoto[] = [makeExisting('a'), makeNew('new')]
    expect(hasPhotoChanges(['a'], selected)).toBe(true)
  })
})
