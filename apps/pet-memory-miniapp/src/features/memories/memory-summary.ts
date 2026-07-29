import type { MemorySpace, MemoryItem, LocalAsset } from '../../types/domain'
import { NEUTRAL_PHOTO_SUMMARY } from './memory-constants'

export interface MemoryEntryViewModel {
  id: string
  summary: string
  dateLabel: string
  thumbnailUri?: string
  thumbnailAlt?: string
  photoCount?: number
}

export interface SpaceSummaryViewModel {
  id: string
  name: string
  coverUri?: string
  latestSummary: string
  dateLabel?: string
  hasMemories: boolean
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}年${m}月${day}日`
}

function findAsset(assetId: string, assets: readonly LocalAsset[]): LocalAsset | undefined {
  return assets.find(a => a.id === assetId)
}

function firstAvailableThumbnail(
  assetIds: readonly string[],
  ownerType: 'space' | 'memory',
  ownerId: string,
  assets: readonly LocalAsset[],
): string | undefined {
  for (const aid of assetIds) {
    const a = findAsset(aid, assets)
    if (a && a.ownerType === ownerType && a.ownerId === ownerId && a.availability === 'available') {
      return a.uri
    }
  }
  return undefined
}

function countAvailableAssets(
  assetIds: readonly string[],
  ownerType: 'space' | 'memory',
  ownerId: string,
  assets: readonly LocalAsset[],
): number {
  let count = 0
  for (const aid of assetIds) {
    const a = findAsset(aid, assets)
    if (a && a.ownerType === ownerType && a.ownerId === ownerId && a.availability === 'available') {
      count++
    }
  }
  return count
}

export function buildSpaceSummary(
  space: MemorySpace,
  memories: readonly MemoryItem[],
  assets: readonly LocalAsset[],
): SpaceSummaryViewModel {
  const spaceMemories = memories.filter(m => m.spaceId === space.id)
  const sorted = spaceMemories.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const latest = sorted[0]

  const coverUri = space.coverAssetId
    ? firstAvailableThumbnail([space.coverAssetId], 'space', space.id, assets)
    : undefined

  return {
    id: space.id,
    name: space.name,
    ...(coverUri !== undefined ? { coverUri } : {}),
    latestSummary: latest ? (latest.originalText || (latest.assetIds.length > 0 ? NEUTRAL_PHOTO_SUMMARY : '')) : '',
    dateLabel: latest ? formatDateLabel(latest.createdAt) : undefined,
    hasMemories: spaceMemories.length > 0,
  }
}

export function buildMemoryEntry(
  memory: MemoryItem,
  assets: readonly LocalAsset[],
): MemoryEntryViewModel {
  const thumbnailUri = firstAvailableThumbnail(memory.assetIds, 'memory', memory.id, assets)
  const photoCount = countAvailableAssets(memory.assetIds, 'memory', memory.id, assets)

  return {
    id: memory.id,
    summary: memory.originalText || (memory.assetIds.length > 0 ? NEUTRAL_PHOTO_SUMMARY : ''),
    dateLabel: formatDateLabel(memory.createdAt),
    ...(thumbnailUri !== undefined ? { thumbnailUri } : {}),
    ...(photoCount > 0 ? { photoCount } : {}),
  }
}
