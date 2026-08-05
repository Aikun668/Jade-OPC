import type { PickedPhoto } from '../../adapters/photo-picker'
import type { MemoryAssetInput } from '../../types/domain'

export type SelectedPhoto =
  | { kind: 'new'; photo: PickedPhoto }
  | { kind: 'existing'; assetId: string }

export const MAX_PHOTOS = 9

export function remainingPhotoSlots(selected: readonly SelectedPhoto[]): number {
  return Math.max(0, MAX_PHOTOS - selected.length)
}

export function appendPickedPhotos(
  selected: readonly SelectedPhoto[],
  picked: readonly PickedPhoto[],
): { kind: 'ok'; selected: SelectedPhoto[] } | { kind: 'limit-exceeded' } {
  const remaining = remainingPhotoSlots(selected)
  if (picked.length > remaining) {
    return { kind: 'limit-exceeded' }
  }
  const newPhotos: SelectedPhoto[] = picked.map((p) => ({ kind: 'new' as const, photo: p }))
  return { kind: 'ok', selected: [...selected, ...newPhotos] }
}

export function removeSelectedPhoto(
  selected: readonly SelectedPhoto[],
  index: number,
): SelectedPhoto[] {
  if (index < 0 || index >= selected.length) return [...selected]
  return [...selected.slice(0, index), ...selected.slice(index + 1)]
}

export function toMemoryAssetInputs(
  selected: readonly SelectedPhoto[],
): MemoryAssetInput[] {
  return selected.map((s) => {
    if (s.kind === 'new') {
      return { kind: 'new' as const, asset: { uri: s.photo.uri } }
    }
    return { kind: 'existing' as const, assetId: s.assetId }
  })
}

export function hasPhotoChanges(
  initialAssetIds: readonly string[],
  selected: readonly SelectedPhoto[],
): boolean {
  if (initialAssetIds.length !== selected.length) return true
  if (selected.some((s) => s.kind === 'new')) return true

  const currentExistingIds = selected
    .filter((s) => s.kind === 'existing')
    .map((s) => s.assetId)

  if (initialAssetIds.length !== currentExistingIds.length) return true
  return !initialAssetIds.every((id, i) => id === currentExistingIds[i])
}
