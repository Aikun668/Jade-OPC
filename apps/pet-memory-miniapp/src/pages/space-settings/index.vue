<template>
  <PageShell
    layout="task-form"
    title="空间设置"
    :show-back="true"
    @back="handleBack"
  >
    <!-- bootstrap loading -->
    <view v-if="!isReady" class="space-settings__center">
      <text class="space-settings__muted">{{ loadingLabel }}</text>
    </view>

    <!-- missing param -->
    <MissingContentState
      v-else-if="isMissingParam"
      title="无法找到这个空间"
      description="缺少空间信息，请返回重试。"
      action-label="返回"
      @action="handleBack"
    />

    <!-- space not found -->
    <MissingContentState
      v-else-if="space === null"
      title="这个空间已经不存在了"
      description="它可能已被删除。"
      action-label="返回"
      @action="handleBack"
    />

    <template v-else>
      <!-- cover photo -->
      <view class="space-settings__cover">
        <view v-if="effectiveCoverUri" class="space-settings__cover-has">
          <image
            class="space-settings__cover-image"
            :src="effectiveCoverUri"
            mode="aspectFill"
          />
          <view class="space-settings__cover-tools">
            <TextAction @press="handlePickPhoto">更换</TextAction>
            <TextAction tone="muted" @press="handleRemovePhoto">移除</TextAction>
          </view>
        </view>
        <view v-else class="space-settings__cover-empty">
          <view class="space-settings__cover-add" @click="handlePickPhoto">
            <text class="space-settings__cover-add-label">添加照片</text>
          </view>
          <view class="space-settings__cover-tools">
            <TextAction @press="handlePickPhoto">更换</TextAction>
          </view>
        </view>
      </view>

      <!-- name field -->
      <view class="space-settings__name-area">
        <text class="space-settings__name-label">Ta 的名字</text>
        <input
          class="space-settings__name-input"
          :value="name"
          :maxlength="50"
          placeholder="Ta 的名字"
          @input="onNameInput"
        />
        <text class="space-settings__name-helper">最多 20 个字</text>
        <text v-if="nameError" class="space-settings__name-error">{{ nameError }}</text>
      </view>

      <!-- save -->
      <view class="space-settings__save">
        <PrimaryButton
          :loading="isSaving"
          loading-label="正在保存..."
          @press="handleSave"
        >保存资料</PrimaryButton>
      </view>
      <text v-if="saveError" class="space-settings__save-error">刚才没有保存成功，可以再试一次。</text>

      <!-- privacy section -->
      <view class="space-settings__section">
        <view class="space-settings__row" @click="handleGoPrivacy">
          <view class="space-settings__row-text">
            <text class="space-settings__row-title">隐私说明</text>
            <text class="space-settings__row-desc">本地数据、照片与 AI 的处理方式</text>
          </view>
          <text class="space-settings__row-arrow">→</text>
        </view>
      </view>

      <!-- danger zone -->
      <view class="space-settings__danger">
        <text class="space-settings__danger-title">删除这个空间</text>
        <text class="space-settings__danger-desc">
          将同时删除{{ deletionScopeText }}，无法恢复。
        </text>
        <TextAction tone="danger" @press="handleDeleteTap">删除{{ space.name }}的空间</TextAction>
      </view>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="删除这个空间"
      :description="deleteDialogDescription"
      confirm-label="删除"
      cancel-label="取消"
      tone="danger"
      :pending="isDeleting"
      :error="deleteError"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import TextAction from '../../components/TextAction.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { getPhotoPicker } from '../../adapters/photo-picker-deps'
import { validateSpaceName } from '../../features/spaces/space-form'
import { parseSpaceSettingsRoute } from '../../features/routing/route-params'
import { PAGE_URLS } from '../../adapters/navigation'
import type { MemorySpace, LocalAsset, NewSessionAssetInput } from '../../types/domain'

const BOOTSTRAP_LOADING_DELAY_MS = 150

const appStore = useAppStore()
const memStore = useMemoryStore()
const nav = getNavigation()
const photoPicker = getPhotoPicker()

// ---- route ----
const spaceId = ref<string | null>(null)
const parseError = ref<{ reason: string; param: string } | null>(null)

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parseSpaceSettingsRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
  } else {
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
})

// ---- loading UX ----
const visibleLoading = ref(false)
let delayTimer: ReturnType<typeof setTimeout> | null = null

const isReady = computed(() => appStore.bootstrapStatus === 'ready')

watch(
  () => appStore.bootstrapStatus,
  (status) => {
    if (delayTimer !== null) { clearTimeout(delayTimer); delayTimer = null }
    if (status === 'loading' || status === 'idle') {
      delayTimer = setTimeout(() => {
        delayTimer = null
        visibleLoading.value = true
      }, BOOTSTRAP_LOADING_DELAY_MS)
    } else {
      visibleLoading.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (delayTimer !== null) clearTimeout(delayTimer)
})

// ---- derived ----
const isMissingParam = computed(() => isReady.value && parseError.value !== null)

const space = computed<MemorySpace | null>(() => {
  if (!isReady.value || spaceId.value === null) return null
  return memStore.findSpace(spaceId.value) ?? null
})

const coverAsset = computed<LocalAsset | null>(() => {
  if (!space.value?.coverAssetId) return null
  return memStore.findAsset(space.value.coverAssetId) ?? null
})

const coverDisplayUri = computed<string | null>(() => coverAsset.value?.uri ?? null)

const memoryCount = computed(() => {
  if (!spaceId.value) return 0
  return memStore.memories.filter(m => m.spaceId === spaceId.value).length
})

const draftCount = computed(() => {
  if (!spaceId.value) return 0
  return memStore.drafts.filter(d => d.spaceId === spaceId.value).length
})

const deletionScopeText = computed(() => {
  const parts: string[] = []
  if (memoryCount.value > 0) parts.push(`${memoryCount.value} 段记忆`)
  if (draftCount.value > 0) parts.push(`${draftCount.value} 条草稿`)
  parts.push('关联照片')
  return parts.join('、')
})

const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

// ---- form state ----
const name = ref('')
const nameError = ref('')
const isSaving = ref(false)
const saveError = ref(false)

// ---- cover change tracking ----
type CoverChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; photo: NewSessionAssetInput }
const coverChange = ref<CoverChange>({ kind: 'keep' })
const coverPreviewUri = ref<string | null>(null)

// Reset form when space loads
watch(space, (s) => {
  if (s) {
    name.value = s.name
    nameError.value = ''
    saveError.value = false
    coverChange.value = { kind: 'keep' }
    coverPreviewUri.value = null
  }
})

// ---- photo picker ----
let isPickingPhoto = false

async function handlePickPhoto(): Promise<void> {
  if (isPickingPhoto) return
  isPickingPhoto = true
  try {
    const result = await photoPicker.pick({ remaining: 1 })

    switch (result.kind) {
      case 'selected': {
        const photo = result.photos[0]
        coverPreviewUri.value = photo.uri
        coverChange.value = { kind: 'replace', photo: { uri: photo.uri } }
        break
      }
      case 'cancelled':
        break
      case 'denied':
      case 'failed':
        break
    }
  } finally {
    isPickingPhoto = false
  }
}

function handleRemovePhoto(): void {
  coverPreviewUri.value = null
  coverChange.value = { kind: 'remove' }
}

// ---- computed display URI (preview takes priority) ----
const effectiveCoverUri = computed(() => {
  if (coverChange.value.kind === 'remove') return null
  if (coverChange.value.kind === 'replace') return coverPreviewUri.value
  return coverDisplayUri.value
})

// ---- name input ----
function onNameInput(e: Event): void {
  const target = e.target as HTMLInputElement | null
  if (target) {
    name.value = target.value
    if (nameError.value) nameError.value = ''
  }
}

// ---- save ----
async function handleSave(): Promise<void> {
  if (isSaving.value || spaceId.value === null) return
  nameError.value = ''
  saveError.value = false

  const validation = validateSpaceName(name.value)
  if (!validation.ok) {
    nameError.value = validation.message
    return
  }

  isSaving.value = true
  try {
    await memStore.updateSpace({
      spaceId: spaceId.value,
      name: validation.value,
      coverPhotoChange: coverChange.value,
    })
    // success — stay on page, reset change tracking
    coverChange.value = { kind: 'keep' }
    coverPreviewUri.value = null
    saveError.value = false
  } catch {
    saveError.value = true
  } finally {
    isSaving.value = false
  }
}

// ---- navigation ----
function handleBack(): void {
  nav.back()
}

function handleGoPrivacy(): void {
  nav.push(`${PAGE_URLS.privacy}?source=settings`)
}

// ---- delete space ----
const deleteDialogOpen = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string>()

const deleteDialogDescription = computed(() => {
  if (!space.value) return ''
  return `将同时删除「${space.value.name}」空间中的${deletionScopeText}，无法恢复。`
})

function handleDeleteTap(): void {
  deleteError.value = undefined
  deleteDialogOpen.value = true
}

function handleDeleteCancel(): void {
  deleteDialogOpen.value = false
}

async function handleDeleteConfirm(): Promise<void> {
  if (isDeleting.value || spaceId.value === null) return
  isDeleting.value = true
  deleteError.value = undefined
  try {
    await memStore.deleteSpace(spaceId.value)
    deleteDialogOpen.value = false
    nav.resetTo({ page: 'spaces' })
  } catch {
    deleteError.value = '删除失败，请重试'
  } finally {
    isDeleting.value = false
  }
}

// ---- test helpers ----
function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseSpaceSettingsRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
    parseError.value = null
  } else {
    spaceId.value = null
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
}

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.space-settings__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
}

.space-settings__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

// ---- cover ----
.space-settings__cover {
  margin-bottom: $pm-space-8;
}

.space-settings__cover-has {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: $pm-space-4;
}

.space-settings__cover-image {
  width: $pm-photo-space-create;
  height: calc($pm-photo-space-create / $pm-photo-preview-ratio);
  border-radius: $pm-radius-md;
}

.space-settings__cover-tools {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.space-settings__cover-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $pm-space-3;
}

.space-settings__cover-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $pm-photo-space-create;
  height: calc($pm-photo-space-create / $pm-photo-preview-ratio);
  border: $pm-border-hairline dashed $pm-color-line;
  border-radius: $pm-radius-md;
}

.space-settings__cover-add-label {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

// ---- name ----
.space-settings__name-area {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  margin-bottom: $pm-space-6;
}

.space-settings__name-label {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-settings__name-input {
  min-height: $pm-control-height-regular;
  padding-inline: $pm-space-4;
  font-size: $pm-font-body;
  color: $pm-color-ink;
  background: $pm-color-surface;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: $pm-radius-sm;
}

.space-settings__name-helper {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-settings__name-error {
  font-size: $pm-font-support;
  color: $pm-color-danger;
}

// ---- save ----
.space-settings__save {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: $pm-space-2;

  :deep(.primary-button) {
    width: 100%;
  }
}

.space-settings__save-error {
  display: block;
  margin-bottom: $pm-space-6;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}

// ---- privacy section ----
.space-settings__section {
  margin-top: $pm-space-8;
  padding-top: $pm-space-6;
  border-top: $pm-border-hairline solid $pm-color-line;
}

.space-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: $pm-space-3;
  min-height: $pm-hit-target-min;
}

.space-settings__row-text {
  display: flex;
  flex-direction: column;
  gap: $pm-space-1;
}

.space-settings__row-title {
  font-size: $pm-font-body;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
}

.space-settings__row-desc {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-settings__row-arrow {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

// ---- danger zone ----
.space-settings__danger {
  margin-top: $pm-space-10;
  padding-top: $pm-space-6;
  border-top: $pm-border-hairline solid $pm-color-line;
}

.space-settings__danger-title {
  display: block;
  font-size: $pm-font-body;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
  margin-bottom: $pm-space-2;
}

.space-settings__danger-desc {
  display: block;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: 1.6;
  margin-bottom: $pm-space-4;
}
</style>
