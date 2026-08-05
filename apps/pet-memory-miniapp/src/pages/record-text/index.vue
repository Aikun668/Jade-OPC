<template>
  <PageShell
    layout="task-form"
    title="留下一段"
    :show-back="true"
    @back="handleBack"
  >
    <MissingContentState
      v-if="parseError"
      title="无法打开记录"
      description="页面参数不正确，请返回重试。"
      action-label="返回"
      @action="handleBack"
    />

    <template v-if="!parseError" #intro>
      <view class="record-text__prompt-area">
        <text class="record-text__eyebrow">一个小问题</text>
        <text class="record-text__prompt">{{ promptText }}</text>
      </view>
    </template>

    <view v-if="!parseError" class="record-text__editor">
      <textarea
        class="record-text__textarea"
        :value="text"
        placeholder="想到什么，就写下什么……"
        :adjust-position="true"
        :hold-keyboard="true"
        @input="handleInput"
      />
    </view>

    <text v-if="isOverLimit" class="record-text__overlimit">已超过 2,000 字，可以整理一下再保存。</text>

    <view v-if="!parseError" class="record-text__photos">
      <view
        v-for="(photo, index) in selectedPhotos"
        :key="index"
        class="record-text__photo-item"
      >
        <image
          v-if="photo.kind === 'new'"
          class="record-text__photo-thumb"
          :src="photo.photo.uri"
          mode="aspectFill"
        />
        <TextAction @press="handleRemovePhoto(index)">移除</TextAction>
      </view>
      <view class="record-text__add-photo">
        <TextAction :disabled="isPicking" @press="handlePickPhotos">加一张照片</TextAction>
      </view>
      <text v-if="pickError" class="record-text__photo-error">{{ pickError }}</text>
    </view>

    <view v-if="!parseError" class="record-text__help">
      <TextAction @press="toggleHelp">有点想不起来</TextAction>
    </view>

    <view v-if="!parseError && showHelp" class="record-text__help-panel">
      <view class="record-text__help-options">
        <view
          class="record-text__help-option"
          @click="handleHelpOption('smaller')"
        >
          <text>换个更小的片段</text>
        </view>
        <view
          class="record-text__help-option"
          @click="handleHelpOption('action')"
        >
          <text>先写下一个动作</text>
        </view>
        <view
          class="record-text__help-option"
          @click="handleHelpOption('exit')"
        >
          <text>这次先不写</text>
        </view>
      </view>
    </view>

    <text v-if="!parseError && helpHint" class="record-text__help-hint">{{ helpHint }}</text>

    <template v-if="!parseError" #actions>
      <view class="record-text__save">
        <PrimaryButton
          :loading="isSavingMemory"
          loading-label="正在保存…"
          @press="handleSaveMemory"
        >留下这段原话</PrimaryButton>
      </view>
      <view class="record-text__draft">
        <TextAction
          :disabled="isSavingMemory || isSavingDraft"
          @press="handleSaveDraft"
        >先留在草稿里</TextAction>
      </view>
      <text v-if="saveError" class="record-text__save-error">刚才没有保存成功，可以再试一次。</text>
    </template>

    <ConfirmDialog
      v-if="!parseError"
      :open="showReturnDialog"
      title="这段还没保存，要先留着吗？"
      description="离开前可以选择先保存到草稿里。"
      confirm-label="保存草稿"
      discard-label="放弃"
      cancel-label="继续写"
      @confirm="handleConfirmLeave"
      @discard="handleDiscardLeave"
      @cancel="showReturnDialog = false"
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
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { getPhotoPicker } from '../../adapters/photo-picker-deps'
import { getPrompt, isValidTextEntry } from '../../features/recording/entry-prompts'
import { isDirtyText, isDirtyAssets } from '../../features/recording/draft-exit'
import { parseTextRecordRoute } from '../../features/routing/route-params'
import {
  remainingPhotoSlots,
  appendPickedPhotos,
  removeSelectedPhoto,
  toMemoryAssetInputs,
  type SelectedPhoto,
} from '../../features/recording/photo-flow'
import type { TextEntry } from '../../features/recording/entry-prompts'
import type { PickResult } from '../../adapters/photo-picker'

const MAX_LENGTH = 2000

const memStore = useMemoryStore()
const nav = getNavigation()
let _pickerCache: ReturnType<typeof getPhotoPicker> | null = null
function getPicker() {
  if (!_pickerCache) _pickerCache = getPhotoPicker()
  return _pickerCache
}

const entry = ref<TextEntry | null>(null)
const spaceId = ref('')
const text = ref('')
const isSavingMemory = ref(false)
const isSavingDraft = ref(false)
const saveError = ref(false)
const showHelp = ref(false)
const helpHint = ref('')
const sourceDraftId = ref<string | null>(null)
const showReturnDialog = ref(false)
const parseError = ref<{ reason: string; param: string } | null>(null)
const selectedPhotos = ref<SelectedPhoto[]>([])
const isPicking = ref(false)
const pickError = ref('')
const initialAssetIds = ref<string[]>([])

const promptText = computed(() => {
  if (!entry.value) return ''
  return getPrompt(entry.value)
})

const isOverLimit = computed(() => text.value.length > MAX_LENGTH)

function currentAssetIds(): string[] {
  return selectedPhotos.value
    .filter((s) => s.kind === 'existing')
    .map((s) => s.assetId)
}

function isDirty(): boolean {
  if (isDirtyText(text.value)) return true
  if (isDirtyAssets(initialAssetIds.value, currentAssetIds())) return true
  if (selectedPhotos.value.some((s) => s.kind === 'new')) return true
  return false
}

function handleInput(e: any): void {
  text.value = e.detail.value
  saveError.value = false
  helpHint.value = ''
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

  switch (result.kind) {
    case 'selected': {
      const appended = appendPickedPhotos(selectedPhotos.value, result.photos)
      if (appended.kind === 'limit-exceeded') {
        pickError.value = '最多只能选择 9 张照片。'
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

function handleRemovePhoto(index: number): void {
  selectedPhotos.value = removeSelectedPhoto(selectedPhotos.value, index)
  pickError.value = ''
}

// ---- saving ----

async function handleSaveMemory(): Promise<void> {
  if (isSavingMemory.value) return
  if (!isDirty()) return
  if (!entry.value) return
  saveError.value = false
  isSavingMemory.value = true
  try {
    const result = await memStore.saveMemory({
      spaceId: spaceId.value,
      entry: entry.value,
      originalText: text.value.trim(),
      assets: toMemoryAssetInputs(selectedPhotos.value),
      sourceDraftId: sourceDraftId.value,
    })
    sourceDraftId.value = null
    await nav.resetTo({ page: 'memory-detail', memoryId: result.id, source: 'new-memory' })
  } catch {
    saveError.value = true
  } finally {
    isSavingMemory.value = false
  }
}

async function handleSaveDraft(): Promise<void> {
  if (isSavingDraft.value || isSavingMemory.value) return
  if (!isDirty()) return
  if (!entry.value) return
  saveError.value = false
  isSavingDraft.value = true
  try {
    await memStore.saveDraft({
      spaceId: spaceId.value,
      entry: entry.value,
      text: text.value.trim(),
      assets: toMemoryAssetInputs(selectedPhotos.value),
    })
    await nav.back()
  } catch {
    saveError.value = true
  } finally {
    isSavingDraft.value = false
  }
}

// ---- help ----

function toggleHelp(): void {
  showHelp.value = !showHelp.value
  helpHint.value = ''
}

function handleHelpOption(option: 'smaller' | 'action' | 'exit'): void {
  showHelp.value = false
  switch (option) {
    case 'smaller':
      helpHint.value = '试试只写下此刻最清晰的那一个画面。'
      break
    case 'action':
      helpHint.value = '从 Ta 刚刚做的一个动作开始写。'
      break
    case 'exit':
      helpHint.value = ''
      handleBack()
      break
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
  if (isDirty() && entry.value) {
    isSavingDraft.value = true
    try {
      await memStore.saveDraft({
        spaceId: spaceId.value,
        entry: entry.value,
        text: text.value.trim(),
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
  const parsed = parseTextRecordRoute(query)
  if (parsed.kind !== 'valid') {
    parseError.value = { reason: parsed.reason, param: parsed.param }
    return
  }
  spaceId.value = parsed.value.spaceId
  if (isValidTextEntry(parsed.value.entry)) {
    entry.value = parsed.value.entry
  }
  // Load from existing draft if draftId is present
  const rawDraftId = parsed.value.draftId
  if (rawDraftId) {
    const existingDraft = memStore.drafts.find(d => d.id === rawDraftId)
    if (existingDraft && existingDraft.spaceId === spaceId.value) {
      sourceDraftId.value = existingDraft.id
      text.value = existingDraft.text
      if (!entry.value && isValidTextEntry(existingDraft.entry)) {
        entry.value = existingDraft.entry
      }
      // Restore draft photos
      if (existingDraft.assetIds.length > 0) {
        const restored: SelectedPhoto[] = existingDraft.assetIds.map((id) => ({
          kind: 'existing' as const,
          assetId: id,
        }))
        selectedPhotos.value = restored
        initialAssetIds.value = existingDraft.assetIds
      }
    }
  }
})

// ---- test-only ----

function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseTextRecordRoute(query)
  if (parsed.kind !== 'valid') {
    parseError.value = { reason: parsed.reason, param: parsed.param }
    spaceId.value = ''
    entry.value = null
    sourceDraftId.value = null
    return
  }
  parseError.value = null
  spaceId.value = parsed.value.spaceId
  const e = parsed.value.entry
  if (isValidTextEntry(e)) entry.value = e
  const dId = parsed.value.draftId
  if (dId) {
    const existingDraft = memStore.drafts.find(d => d.id === dId)
    if (existingDraft && existingDraft.spaceId === spaceId.value) {
      sourceDraftId.value = existingDraft.id
      text.value = existingDraft.text
      if (!entry.value && isValidTextEntry(existingDraft.entry)) {
        entry.value = existingDraft.entry
      }
      if (existingDraft.assetIds.length > 0) {
        selectedPhotos.value = existingDraft.assetIds.map((id) => ({
          kind: 'existing' as const,
          assetId: id,
        }))
        initialAssetIds.value = existingDraft.assetIds
      }
    }
  }
}

function _setTextForTest(value: string): void {
  text.value = value
}

function _setPhotosForTest(photos: SelectedPhoto[]): void {
  selectedPhotos.value = photos
}

defineExpose({ _setQueryForTest, _setTextForTest, _setPhotosForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.record-text__prompt-area {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
}

.record-text__eyebrow {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.record-text__prompt {
  max-width: 26em;
  font-size: $pm-font-page-title;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.record-text__editor {
  margin-top: $pm-space-6;
  overflow: hidden;
  background: $pm-color-surface;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: $pm-radius-md;
}

.record-text__textarea {
  width: 100%;
  min-height: 472rpx;
  padding: 34rpx 32rpx;
  font-size: $pm-font-body;
  line-height: 1.8;
  color: $pm-color-ink;
  background: transparent;
  border: none;
  border-radius: 0;
  resize: none;
  box-sizing: border-box;
}

.record-text__overlimit {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-danger;
}

.record-text__help {
  display: flex;
  justify-content: flex-end;
  margin-top: $pm-space-2;
}

.record-text__help-panel {
  margin-top: $pm-space-3;
  padding: $pm-space-4;
  background: $pm-color-surface;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: $pm-radius-sm;
}

.record-text__help-options {
  display: flex;
  flex-direction: column;
  gap: $pm-space-3;
}

.record-text__help-option {
  padding-block: $pm-space-2;
  font-size: $pm-font-body;
  color: $pm-color-olive;
  min-height: $pm-hit-target-min;
  display: flex;
  align-items: center;
}

.record-text__save {
  display: flex;
  justify-content: center;
}

.record-text__draft {
  display: flex;
  justify-content: center;
  margin-top: $pm-space-2;
}

.record-text__help-hint {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-olive;
}

.record-text__save-error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}

.record-text__photos {
  margin-top: $pm-space-4;
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-2;
  align-items: center;
}

.record-text__photo-item {
  display: flex;
  align-items: center;
  gap: $pm-space-1;
}

.record-text__photo-thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: $pm-radius-sm;
  flex-shrink: 0;
}

.record-text__add-photo {
  display: flex;
  align-items: center;
}

.record-text__photo-error {
  width: 100%;
  font-size: $pm-font-support;
  color: $pm-color-muted;
}
</style>
