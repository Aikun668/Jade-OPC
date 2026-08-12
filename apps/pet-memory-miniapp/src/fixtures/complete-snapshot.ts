import type { MemorySnapshot } from '../types/domain'

/**
 * 完整样本：团团 + 豆豆两个空间。
 * - 团团：空间照片、两段正式记忆（有图+无图）、一条草稿；正式记忆初始不预生成 AI 草稿
 * - 豆豆：无空间照片、无正式记忆
 *
 * 所有照片使用 bundled 持久化，路径为批准的打包资源。
 * 此夹具通过正式 validateSnapshot 校验。
 */
export const completeSnapshot: MemorySnapshot = {
  schemaVersion: 1,
  sampleMode: 'complete',
  hasCompletedOnboarding: true,
  spaces: [
    {
      id: 's_tuantu',
      name: '团团',
      coverAssetId: 'a_tuantu_cover',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
    },
    {
      id: 's_doudou',
      name: '豆豆',
      coverAssetId: null,
      createdAt: '2026-02-20T09:00:00.000Z',
      updatedAt: '2026-02-20T09:00:00.000Z',
    },
  ],
  memories: [
    {
      id: 'm_tuantu_daily1',
      spaceId: 's_tuantu',
      entry: 'daily',
      originalText: '团团今天在窗台上晒了一下午太阳，毛茸茸的耳朵在光里变成了粉红色。',
      aiCandidateText: null,
      assetIds: [],
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'm_tuantu_photo1',
      spaceId: 's_tuantu',
      entry: 'photo',
      originalText: '第一次见到团团时，它正从纸箱里探出脑袋看着我。',
      aiCandidateText: null,
      assetIds: ['a_tuantu_photo1', 'a_tuantu_photo2'],
      createdAt: '2026-04-15T14:00:00.000Z',
      updatedAt: '2026-04-20T09:00:00.000Z',
    },
  ],
  drafts: [
    {
      id: 'd_tuantu_draft1',
      spaceId: 's_tuantu',
      entry: 'meeting',
      text: '还记得那天在宠物店门口...',
      assetIds: ['a_tuantu_draft_photo'],
      createdAt: '2026-05-20T16:00:00.000Z',
      updatedAt: '2026-05-20T16:30:00.000Z',
    },
  ],
  assets: [
    {
      id: 'a_tuantu_cover',
      ownerType: 'space',
      ownerId: 's_tuantu',
      uri: '/fixtures/tuantu-cover.png',
      persistence: 'bundled',
      availability: 'available',
      order: 0,
    },
    {
      id: 'a_tuantu_photo1',
      ownerType: 'memory',
      ownerId: 'm_tuantu_photo1',
      uri: '/fixtures/tuantu-photo1.png',
      persistence: 'bundled',
      availability: 'available',
      order: 0,
    },
    {
      id: 'a_tuantu_photo2',
      ownerType: 'memory',
      ownerId: 'm_tuantu_photo1',
      uri: '/fixtures/tuantu-photo2.png',
      persistence: 'bundled',
      availability: 'available',
      order: 1,
    },
    {
      id: 'a_tuantu_draft_photo',
      ownerType: 'draft',
      ownerId: 'd_tuantu_draft1',
      uri: '/fixtures/tuantu-cover.png',
      persistence: 'bundled',
      availability: 'available',
      order: 0,
    },
  ],
}
