<template>
  <PageShell
    layout="task-form"
    title="一张照片"
    compact-intro
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
      <view class="record-photo__media record-photo__media--empty">
        <view class="record-photo__add-btn" @click="handlePickPhotos">
          <view class="record-photo__add-photo-icon" aria-hidden="true" />
          <text class="record-photo__add-label">添加一张照片</text>
        </view>
      </view>
      <text v-if="pickError" class="record-photo__pick-feedback">{{ pickError }}</text>
    </view>

    <view v-if="!parseError && selectedPhotos.length > 0" class="record-photo__preview">
      <view
        v-if="selectedPhotos.length === 1 && firstPhotoUri"
        class="record-photo__media record-photo__media--selected"
      >
        <image
          class="record-photo__single-preview"
          :src="firstPhotoUri"
          mode="aspectFill"
        />
        <button
          class="record-photo__remove-button"
          aria-label="移除照片"
          @click.stop="handleRequestRemovePhoto"
        >
          <text class="record-photo__remove-icon" aria-hidden="true">×</text>
        </button>
        <view class="record-photo__photo-actions">
          <TextAction @press="handleReplacePhoto">更换照片</TextAction>
        </view>
      </view>
      <view v-else-if="selectedPhotos.length > 1" class="record-photo__stack-media">
        <PhotoStack
          :items="displayPhotos"
          @open="handleOpenViewer"
          @change="handleViewerChange"
        />
        <button
          class="record-photo__remove-button"
          aria-label="移除照片"
          @click.stop="handleRequestRemovePhoto"
        >
          <text class="record-photo__remove-icon" aria-hidden="true">×</text>
        </button>
      </view>

      <view v-if="selectedPhotos.length > 1" class="record-photo__photo-actions record-photo__photo-actions--stack">
        <TextAction @press="handlePickPhotos">添加照片</TextAction>
      </view>

      <text v-if="pickError" class="record-photo__pick-feedback">{{ pickError }}</text>
    </view>

    <view
      v-if="postPhotoRendered && !parseError"
      class="record-photo__post-photo"
      :class="{ 'record-photo__post-photo--visible': postPhotoVisible }"
    >
        <view class="record-photo__choice-list">
          <view
            class="record-photo__choice"
            :class="{ 'record-photo__choice--disabled': selectedPhotos.length === 0 || isSavingMemory || isSavingDraft }"
            :aria-disabled="selectedPhotos.length === 0 || isSavingMemory || isSavingDraft ? 'true' : undefined"
            @click="handleSavePhotosOnly"
          >
            <view class="record-photo__choice-copy">
              <text class="record-photo__choice-title">先只留下照片</text>
              <text class="record-photo__choice-desc">这已经是一段完整的记忆</text>
            </view>
            <text class="record-photo__choice-arrow" aria-hidden="true">›</text>
          </view>
          <view
            class="record-photo__choice"
            :class="{ 'record-photo__choice--disabled': isSavingMemory || isSavingDraft }"
            :aria-disabled="isSavingMemory || isSavingDraft ? 'true' : undefined"
            @click="handleContinueWithText"
          >
            <view class="record-photo__choice-copy">
              <text class="record-photo__choice-title">说说最先想起的事</text>
              <text class="record-photo__choice-desc">只问一个问题，不会自动追问</text>
            </view>
            <text class="record-photo__choice-arrow" aria-hidden="true">›</text>
          </view>
          <text v-if="saveError" class="record-photo__save-error">刚才没有保存成功，可以再试一次。</text>
        </view>

        <view class="record-photo__session-note">
          <text class="record-photo__session-note-text">M0 中，这些照片只用于本次会话预览，不会被描述为已经永久保存。</text>
        </view>
    </view>

    <ConfirmDialog
      v-if="!parseError"
      :open="showReturnDialog"
      title="照片还没处理，要离开吗？"
      description="离开前照片不会自动保存。"
      confirm-label="保存草稿"
      discard-label="放弃"
      cancel-label="继续编辑"
      action-layout="list"
      @confirm="handleConfirmLeave"
      @discard="handleDiscardLeave"
      @cancel="showReturnDialog = false"
    />

    <ConfirmDialog
      v-if="!parseError"
      :open="showRemovePhotoDialog"
      title="要移除这张照片吗？"
      description="移除后可以重新添加照片。"
      confirm-label="移除照片"
      cancel-label="取消"
      tone="danger"
      @confirm="handleConfirmRemovePhoto"
      @cancel="showRemovePhotoDialog = false"
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
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
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
const postPhotoRendered = ref(false)
const postPhotoVisible = ref(false)
const isSavingMemory = ref(false)
const isSavingDraft = ref(false)
const isPicking = ref(false)
const saveError = ref(false)
const pickError = ref('')
const showReturnDialog = ref(false)
const showRemovePhotoDialog = ref(false)
const parseError = ref<{ reason: string; param: string } | null>(null)
const viewerOpen = ref(false)
const viewerIndex = ref(0)
const removePhotoIndex = ref(0)
const POST_PHOTO_LEAVE_DURATION_MS = 240
let postPhotoHideTimer: ReturnType<typeof setTimeout> | null = null

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

function clearPostPhotoHideTimer(): void {
  if (postPhotoHideTimer === null) return
  clearTimeout(postPhotoHideTimer)
  postPhotoHideTimer = null
}

watch(
  () => selectedPhotos.value.length > 0,
  (hasPhoto) => {
    clearPostPhotoHideTimer()

    if (hasPhoto) {
      postPhotoRendered.value = true
      postPhotoVisible.value = false
      void nextTick(() => {
        if (selectedPhotos.value.length > 0) postPhotoVisible.value = true
      })
      return
    }

    if (!postPhotoRendered.value) return
    postPhotoVisible.value = false
    postPhotoHideTimer = setTimeout(() => {
      postPhotoRendered.value = false
      postPhotoHideTimer = null
    }, POST_PHOTO_LEAVE_DURATION_MS)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearPostPhotoHideTimer()
})

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

async function handleReplacePhoto(): Promise<void> {
  if (isPicking.value || isSavingMemory.value || isSavingDraft.value) return
  pickError.value = ''
  isPicking.value = true
  let result: PickResult
  try {
    result = await getPicker().pick({ remaining: 1 })
  } catch {
    result = { kind: 'failed' }
  }
  isPicking.value = false

  if (result.kind === 'selected') {
    const photo = result.photos[0]
    if (photo) selectedPhotos.value = [{ kind: 'new', photo }]
    return
  }
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
    case 'limit-reached':
      pickError.value = `最多只能选择 ${MAX_PHOTOS} 张照片。`
      break
  }
}

// ---- photo removal ----

function handleRequestRemovePhoto(): void {
  if (selectedPhotos.value.length === 0) return
  removePhotoIndex.value = Math.min(viewerIndex.value, selectedPhotos.value.length - 1)
  showRemovePhotoDialog.value = true
}

function handleConfirmRemovePhoto(): void {
  selectedPhotos.value = removeSelectedPhoto(selectedPhotos.value, removePhotoIndex.value)
  viewerIndex.value = Math.max(0, Math.min(viewerIndex.value, selectedPhotos.value.length - 1))
  showRemovePhotoDialog.value = false
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
  if (isSavingMemory.value || isSavingDraft.value) return
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
  if (isSavingMemory.value || isSavingDraft.value) return
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
  padding-top: $pm-space-1;
  gap: $pm-space-3;
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
  margin-top: $pm-space-4;
}

.record-photo__media {
  position: relative;
  width: 100%;
  aspect-ratio: #{$pm-photo-preview-ratio};
  overflow: hidden;
  border-radius: $pm-radius-md;
}

.record-photo__media--empty {
  background: transparent;
}

.record-photo__add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $pm-space-2;
  width: 100%;
  height: 100%;
  padding: $pm-space-6;
  box-sizing: border-box;
  border: $pm-border-hairline dashed $pm-color-line;
  border-radius: $pm-radius-md;
}

.record-photo__add-photo-icon {
  position: relative;
  flex: 0 0 auto;
  width: $pm-icon-sm;
  height: $pm-icon-sm;
  box-sizing: border-box;
  border: $pm-border-hairline solid $pm-color-muted;
  border-radius: $pm-space-1;
}

.record-photo__add-photo-icon::before {
  content: '';
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 50%;
  background: $pm-color-muted;
}

.record-photo__add-photo-icon::after {
  content: '';
  position: absolute;
  left: 5rpx;
  bottom: 5rpx;
  width: 15rpx;
  height: 9rpx;
  border-top: $pm-border-hairline solid $pm-color-muted;
  border-left: $pm-border-hairline solid $pm-color-muted;
  transform: skew(-24deg) rotate(24deg);
}

.record-photo__add-label {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.record-photo__preview {
  margin-top: $pm-space-4;
}

.record-photo__single-preview {
  width: 100%;
  height: 100%;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
}

.record-photo__photo-actions {
  position: absolute;
  right: $pm-space-3;
  bottom: $pm-space-3;

  :deep(.text-action) {
    min-height: $pm-control-height-compact;
    padding-inline: $pm-space-2;
    border-radius: $pm-radius-sm;
    background: $pm-color-surface;
    color: $pm-color-ink;
    box-shadow: $pm-shadow-paper;
  }

  :deep(.text-action__label) {
    color: $pm-color-ink;
  }
}

.record-photo__photo-actions--stack {
  position: static;
  display: flex;
  justify-content: flex-end;
  margin-top: $pm-space-3;
}

.record-photo__stack-media {
  position: relative;
}

.record-photo__remove-button {
  position: absolute;
  top: $pm-space-3;
  right: $pm-space-3;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: $pm-icon-md;
  height: $pm-icon-md;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: $pm-color-surface;
  color: $pm-color-ink;
  box-shadow: $pm-shadow-paper;

  &::after {
    border: none;
  }
}

.record-photo__remove-icon {
  font-size: $pm-font-item-title;
  line-height: 1;
  color: $pm-color-ink;
}

.record-photo__post-photo {
  opacity: 0;
  transform: translateY(40rpx);
  transition:
    opacity 360ms cubic-bezier(0.22, 0.8, 0.28, 1),
    transform 360ms cubic-bezier(0.22, 0.8, 0.28, 1);
}

.record-photo__post-photo--visible {
  opacity: 1;
  transform: translateY(0);
}

.record-photo__post-photo:not(.record-photo__post-photo--visible) {
  transition-duration: 240ms;
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}

.record-photo__choice-list {
  width: 100%;
  margin-top: $pm-space-6;
  border-top: $pm-border-hairline solid $pm-color-line;
}

.record-photo__choice {
  display: flex;
  align-items: center;
  gap: $pm-space-3;
  min-height: 112rpx;
  padding: $pm-space-3 0;
  box-sizing: border-box;
  border-bottom: $pm-border-hairline solid $pm-color-line;
}

.record-photo__choice-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $pm-space-1;
}

.record-photo__choice-title {
  font-size: $pm-font-body;
  color: $pm-color-ink;
}

.record-photo__choice-desc {
  font-size: $pm-font-support;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

.record-photo__choice-arrow {
  flex: 0 0 auto;
  font-size: $pm-icon-md;
  line-height: 1;
  color: $pm-color-muted;
}

.record-photo__choice--disabled {
  opacity: 0.48;
}

.record-photo__session-note {
  margin-top: $pm-space-6;
  padding: 0;
}

.record-photo__session-note-text {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: $pm-leading-body;
}

.record-photo__save-error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}

.record-photo__pick-feedback {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  text-align: center;
}
</style>
