<template>
  <PageShell
    layout="task-form"
    title="一张照片"
    :show-back="true"
    @back="handleBack"
  >
    <MissingContentState
      v-if="parseError"
      title="无法打开照片记录"
      description="页面参数不正确，请返回重试。"
      action-label="返回"
      @action="handleBack"
    />

    <template v-if="!parseError" #intro>
      <view class="record-photo__intro">
        <text class="record-photo__title">先把这张照片留在这里</text>
        <text class="record-photo__desc">照片不需要说明。你也可以再写下一句看到它时最先想起的话。</text>
      </view>
    </template>

    <view v-if="!parseError && selectedPhotos.length === 0" class="record-photo__empty">
      <view class="record-photo__add-btn" @click="handlePickPhotos">
        <text class="record-photo__add-label">添加一张照片</text>
      </view>
      <text v-if="pickError" class="record-photo__pick-feedback">{{ pickError }}</text>
    </view>

    <view v-if="!parseError && selectedPhotos.length > 0" class="record-photo__preview">
      <image
        v-if="selectedPhotos.length === 1 && firstPhotoUri"
        class="record-photo__single-preview"
        :src="firstPhotoUri"
        mode="aspectFit"
      />
      <PhotoStack
        v-else-if="selectedPhotos.length > 1"
        :items="displayPhotos"
        @open="handleOpenViewer"
        @change="handleViewerChange"
      />

      <view class="record-photo__photo-actions">
        <TextAction @press="handlePickPhotos">更换照片</TextAction>
      </view>

      <view class="record-photo__list">
        <view
          v-for="(photo, index) in selectedPhotos"
          :key="index"
          class="record-photo__list-item"
        >
          <image
            v-if="photo.kind === 'new'"
            class="record-photo__thumb"
            :src="photo.photo.uri"
            mode="aspectFill"
          />
          <view class="record-photo__list-item-info">
            <text class="record-photo__list-item-label">照片 {{ index + 1 }}</text>
          </view>
          <TextAction @press="handleRemovePhoto(index)">移除</TextAction>
        </view>
      </view>

      <text v-if="pickError" class="record-photo__pick-feedback">{{ pickError }}</text>
    </view>

    <view v-if="!parseError" class="record-photo__session-note">
      <text class="record-photo__session-note-text">M0 中，这些照片只用于本次会话预览，不会被描述为已经永久保存。</text>
    </view>

    <template v-if="!parseError" #actions>
      <view class="record-photo__save">
        <PrimaryButton
          :loading="isSavingMemory"
          loading-label="正在保存…"
          @press="handleSavePhotosOnly"
        >先只留下照片</PrimaryButton>
      </view>
      <view class="record-photo__continue">
        <TextAction
          :disabled="isSavingMemory || isSavingDraft"
          @press="handleContinueWithText"
        >说说最先想起的事</TextAction>
      </view>
      <text v-if="saveError" class="record-photo__save-error">刚才没有保存成功，可以再试一次。</text>
    </template>

    <ConfirmDialog
      v-if="!parseError"
      :open="showReturnDialog"
      title="照片还没处理，要离开吗？"
      description="离开前照片不会自动保存。"
      confirm-label="保存草稿"
      discard-label="放弃"
      cancel-label="继续编辑"
      @confirm="handleConfirmLeave"
      @discard="handleDiscardLeave"
      @cancel="showReturnDialog = false"
    />

    <PhotoViewer
      :open="viewerOpen"
      :items="displayPhotos"
      :initial-index="viewerIndex"
      @close="viewerOpen = false"
      @change="handleViewerChange"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import PhotoStack from '../../components/PhotoStack.vue'
import PhotoViewer from '../../components/PhotoViewer.vue'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { getPhotoPicker } from '../../adapters/photo-picker-deps'
import {
  MAX_PHOTOS,
  remainingPhotoSlots,
  appendPickedPhotos,
  removeSelectedPhoto,
  toMemoryAssetInputs,
  hasPhotoChanges,
  type SelectedPhoto,
} from '../../features/recording/photo-flow'
import { isDirtyAssets } from '../../features/recording/draft-exit'
import { parsePhotoRecordRoute } from '../../features/routing/route-params'
import type { PhotoViewModel } from '../../features/photos/photo-types'
import type { PickResult } from '../../adapters/photo-picker'

const memStore = useMemoryStore()
const nav = getNavigation()
let _pickerCache: ReturnType<typeof getPhotoPicker> | null = null
function getPicker() {
  if (!_pickerCache) _pickerCache = getPhotoPicker()
  return _pickerCache
}

const spaceId = ref('')
const selectedPhotos = ref<SelectedPhoto[]>([])
const isSavingMemory = ref(false)
const isSavingDraft = ref(false)
const isPicking = ref(false)
const saveError = ref(false)
const pickError = ref('')
const showReturnDialog = ref(false)
const parseError = ref<{ reason: string; param: string } | null>(null)
const viewerOpen = ref(false)
const viewerIndex = ref(0)

const firstPhotoUri = computed(() => {
  const first = selectedPhotos.value[0]
  if (!first) return ''
  if (first.kind === 'new') return first.photo.uri
  const asset = memStore.findAsset(first.assetId)
  return asset?.uri ?? ''
})

const displayPhotos = computed<PhotoViewModel[]>(() =>
  selectedPhotos.value.map((s, i) => {
    if (s.kind === 'new') {
      return { id: `temp-${i}`, uri: s.photo.uri, alt: '', availability: 'available' as const }
    }
    const asset = memStore.findAsset(s.assetId)
    if (!asset) {
      return { id: s.assetId, uri: '', alt: '照片已失效', availability: 'expired' as const }
    }
    return {
      id: s.assetId,
      uri: asset.uri,
      alt: '',
      availability: asset.availability,
    }
  }),
)

const initialAssetIds = ref<string[]>([])

function isDirty(): boolean {
  return selectedPhotos.value.length > 0
}

// ---- photo picking ----

async function handlePickPhotos(): Promise<void> {
  if (isPicking.value) return
  pickError.value = ''
  isPicking.value = true
  let result: PickResult
  try {
    result = await getPicker().pick({ remaining: remainingPhotoSlots(selectedPhotos.value) })
  } catch {
    result = { kind: 'failed' }
  }
  isPicking.value = false
  applyPickResult(result)
}

function applyPickResult(result: PickResult): void {
  switch (result.kind) {
    case 'selected': {
      const appended = appendPickedPhotos(selectedPhotos.value, result.photos)
      if (appended.kind === 'limit-exceeded') {
        pickError.value = `最多只能选择 ${MAX_PHOTOS} 张照片。`
        return
      }
      selectedPhotos.value = appended.selected
      break
    }
    case 'cancelled':
      break
    case 'denied':
      pickError.value = '需要相册权限才能选择照片，请在系统设置中允许访问相册。'
      break
    case 'failed':
      pickError.value = '照片选择失败，可以再试一次。'
      break
  }
}

// ---- photo removal ----

function handleRemovePhoto(index: number): void {
  selectedPhotos.value = removeSelectedPhoto(selectedPhotos.value, index)
  pickError.value = ''
}

// ---- viewer ----

function handleOpenViewer(index: number): void {
  viewerIndex.value = index
  viewerOpen.value = true
}

function handleViewerChange(index: number): void {
  viewerIndex.value = index
}

// ---- saving ----

async function handleSavePhotosOnly(): Promise<void> {
  if (isSavingMemory.value) return
  if (selectedPhotos.value.length === 0) return
  saveError.value = false
  isSavingMemory.value = true
  try {
    const result = await memStore.saveMemory({
      spaceId: spaceId.value,
      entry: 'photo',
      originalText: '',
      assets: toMemoryAssetInputs(selectedPhotos.value),
      sourceDraftId: null,
    })
    await nav.resetTo({ page: 'memory-detail', memoryId: result.id, source: 'new-memory' })
  } catch {
    saveError.value = true
  } finally {
    isSavingMemory.value = false
  }
}

async function handleContinueWithText(): Promise<void> {
  if (isSavingDraft.value || isSavingMemory.value) return
  saveError.value = false
  isSavingDraft.value = true
  try {
    const draft = await memStore.saveDraft({
      spaceId: spaceId.value,
      entry: 'photo',
      text: '',
      assets: toMemoryAssetInputs(selectedPhotos.value),
    })
    const params = `spaceId=${encodeURIComponent(spaceId.value)}&entry=photo&draftId=${encodeURIComponent(draft.id)}`
    await nav.push(`${PAGE_URLS['record-text']}?${params}`)
  } catch {
    saveError.value = true
  } finally {
    isSavingDraft.value = false
  }
}

// ---- back ----

function handleBack(): void {
  if (isDirty()) {
    showReturnDialog.value = true
  } else {
    nav.back()
  }
}

async function handleConfirmLeave(): Promise<void> {
  showReturnDialog.value = false
  if (selectedPhotos.value.length > 0) {
    isSavingDraft.value = true
    try {
      await memStore.saveDraft({
        spaceId: spaceId.value,
        entry: 'photo',
        text: '',
        assets: toMemoryAssetInputs(selectedPhotos.value),
      })
    } catch {
      isSavingDraft.value = false
      saveError.value = true
      return
    }
    isSavingDraft.value = false
  }
  nav.back()
}

function handleDiscardLeave(): void {
  showReturnDialog.value = false
  nav.back()
}

// ---- init ----

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parsePhotoRecordRoute(query)
  if (parsed.kind !== 'valid') {
    parseError.value = { reason: parsed.reason, param: parsed.param }
    return
  }
  spaceId.value = parsed.value.spaceId
})

// ---- test-only ----

function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parsePhotoRecordRoute(query)
  if (parsed.kind !== 'valid') {
    parseError.value = { reason: parsed.reason, param: parsed.param }
    spaceId.value = ''
    return
  }
  parseError.value = null
  spaceId.value = parsed.value.spaceId
}

function _setPhotosForTest(photos: SelectedPhoto[]): void {
  selectedPhotos.value = photos
}

defineExpose({ _setQueryForTest, _setPhotosForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.record-photo__intro {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
}

.record-photo__title {
  max-width: 26em;
  font-size: $pm-font-page-title;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.record-photo__desc {
  font-size: $pm-font-body;
  color: $pm-color-muted;
  line-height: $pm-leading-body;
}

.record-photo__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: $pm-space-8;
  padding: $pm-space-10 0;
}

.record-photo__add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $pm-space-2;
  padding: $pm-space-6;
  border: $pm-border-hairline dashed $pm-color-line;
  border-radius: $pm-radius-md;
  width: 100%;
  min-height: $pm-hit-target-min;
}

.record-photo__add-label {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.record-photo__preview {
  margin-top: $pm-space-6;
}

.record-photo__single-preview {
  width: 100%;
  height: 480rpx;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
}

.record-photo__photo-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $pm-space-3;
}

.record-photo__list {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  margin-top: $pm-space-4;
}

.record-photo__list-item {
  display: flex;
  align-items: center;
  gap: $pm-space-3;
  padding: $pm-space-2;
  background: $pm-color-surface;
  border-radius: $pm-radius-sm;
}

.record-photo__thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: $pm-radius-sm;
  flex-shrink: 0;
}

.record-photo__list-item-info {
  flex: 1;
}

.record-photo__list-item-label {
  font-size: $pm-font-body;
  color: $pm-color-ink;
}

.record-photo__pick-feedback {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  text-align: center;
}

.record-photo__session-note {
  margin-top: $pm-space-8;
  padding: 0;
}

.record-photo__session-note-text {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: $pm-leading-body;
}

.record-photo__save {
  display: flex;
  width: 100%;

  :deep(.primary-button) {
    width: 100%;
  }
}

.record-photo__continue {
  display: flex;
  justify-content: center;
  margin-top: $pm-space-2;
}

.record-photo__save-error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}
</style>
