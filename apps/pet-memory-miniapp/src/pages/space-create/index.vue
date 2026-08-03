<template>
  <PageShell
    layout="task-form"
    :show-back="true"
    :keyboard-open="keyboardOpen"
    @back="handleBack"
  >
    <template #intro>
      <view class="space-create__intro">
        <text class="space-create__title">创建 Ta 的空间</text>
        <text class="space-create__desc">先写下 Ta 的名字</text>
      </view>
    </template>

    <view class="space-create__photo-area">
      <view v-if="!coverPhoto" class="space-create__photo-empty">
        <view class="space-create__photo-add" @click="handlePickPhoto">
          <text class="space-create__photo-add-label">添加一张照片</text>
        </view>
      </view>
      <view v-else class="space-create__photo-has">
        <image
          class="space-create__photo-image"
          :src="coverPhoto.uri"
          mode="aspectFill"
        />
        <view class="space-create__photo-tools">
          <view class="space-create__photo-replace" @click="handlePickPhoto">
            <text class="space-create__photo-replace-label">更换</text>
          </view>
          <view class="space-create__photo-remove" @click="handleRemovePhoto">
            <text class="space-create__photo-remove-label">移除</text>
          </view>
        </view>
      </view>
      <text v-if="photoError" class="space-create__photo-error">{{ photoError }}</text>
    </view>

    <view class="space-create__name-area">
      <input
        class="space-create__name-input"
        v-model="name"
        placeholder="Ta 的名字"
        :maxlength="50"
        @focus="keyboardOpen = true"
        @blur="keyboardOpen = false"
      />
      <text class="space-create__name-helper">最多 20 个字</text>
      <text v-if="nameError" class="space-create__name-error">{{ nameError }}</text>
    </view>

    <template #actions>
      <view class="space-create__submit">
        <PrimaryButton
          :loading="isSubmitting"
          loading-label="正在创建..."
          @press="handleSubmit"
        >创建 Ta 的空间</PrimaryButton>
      </view>
      <text v-if="submitError" class="space-create__submit-error">刚才没有准备好，可以再试一次。</text>
    </template>

    <ConfirmDialog
      :open="showReturnDialog"
      title="这次先不创建了吗？"
      description="你输入的名字和照片不会被保存。"
      confirm-label="先不创建"
      cancel-label="继续填写"
      @confirm="handleConfirmLeave"
      @cancel="showReturnDialog = false"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { getPhotoPicker } from '../../adapters/photo-picker-deps'
import { validateSpaceName } from '../../features/spaces/space-form'
import type { NewSessionAssetInput } from '../../types/domain'

const memStore = useMemoryStore()
const nav = getNavigation()
const photoPicker = getPhotoPicker()

const name = ref('')
const coverPhoto = ref<{ uri: string } | null>(null)
const coverPhotoInput = ref<NewSessionAssetInput | null>(null)
const isPickingPhoto = ref(false)
const isSubmitting = ref(false)
const submitError = ref(false)
const nameError = ref('')
const photoError = ref('')
const showReturnDialog = ref(false)
const keyboardOpen = ref(false)

watch(name, () => {
  nameError.value = ''
})

function isDirty(): boolean {
  return name.value.trim() !== '' || coverPhoto.value !== null
}

async function handlePickPhoto(): Promise<void> {
  if (isPickingPhoto.value) return
  isPickingPhoto.value = true
  photoError.value = ''
  try {
    const result = await photoPicker.pick({ remaining: 1 })

    switch (result.kind) {
      case 'selected': {
        const photo = result.photos[0]
        coverPhoto.value = { uri: photo.uri }
        coverPhotoInput.value = { uri: photo.uri }
        break
      }
      case 'cancelled':
        break
      case 'denied':
        photoError.value = '需要相册权限才能添加照片。'
        break
      case 'failed':
        photoError.value = '照片选择失败，请再试一次。'
        break
    }
  } finally {
    isPickingPhoto.value = false
  }
}

function handleRemovePhoto(): void {
  coverPhoto.value = null
  coverPhotoInput.value = null
  photoError.value = ''
}

async function handleSubmit(): Promise<void> {
  if (isSubmitting.value) return
  nameError.value = ''
  submitError.value = false

  const validation = validateSpaceName(name.value)
  if (!validation.ok) {
    nameError.value = validation.message
    return
  }

  isSubmitting.value = true
  try {
    const result = await memStore.createSpace({
      name: validation.value,
      coverPhoto: coverPhotoInput.value,
    })
    await nav.resetTo({ page: 'space-home', spaceId: result.id })
  } catch {
    submitError.value = true
  } finally {
    isSubmitting.value = false
  }
}

function handleBack(): void {
  if (isDirty()) {
    showReturnDialog.value = true
  } else {
    nav.back()
  }
}

function handleConfirmLeave(): void {
  showReturnDialog.value = false
  nav.back()
}
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.space-create__intro {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  text-align: center;
}

.space-create__title {
  font-size: $pm-font-page-title;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.space-create__desc {
  font-size: $pm-font-body;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

// ---- photo picker ----
.space-create__photo-area {
  margin-top: $pm-space-8;
}

.space-create__photo-empty {
  display: flex;
  justify-content: center;
}

.space-create__photo-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $pm-photo-space-create;
  height: calc($pm-photo-space-create / $pm-photo-preview-ratio);
  border: $pm-border-hairline dashed $pm-color-line;
  border-radius: $pm-radius-md;
}

.space-create__photo-add-label {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-create__photo-has {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $pm-space-3;
}

.space-create__photo-image {
  width: $pm-photo-space-create;
  height: calc($pm-photo-space-create / $pm-photo-preview-ratio);
  border-radius: $pm-radius-md;
}

.space-create__photo-tools {
  display: flex;
  gap: $pm-space-4;
}

.space-create__photo-replace {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: $pm-hit-target-min;
  padding-inline: $pm-space-3;
}

.space-create__photo-replace-label {
  font-size: $pm-font-support;
  color: $pm-color-olive;
}

.space-create__photo-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: $pm-hit-target-min;
  padding-inline: $pm-space-3;
}

.space-create__photo-remove-label {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-create__photo-error {
  display: block;
  margin-top: $pm-space-3;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}

// ---- name input ----
.space-create__name-area {
  margin-top: $pm-space-8;
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
}

.space-create__name-input {
  min-height: $pm-control-height-regular;
  padding-inline: $pm-space-4;
  font-size: $pm-font-body;
  color: $pm-color-ink;
  background: $pm-color-surface;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: $pm-radius-sm;
}

.space-create__name-helper {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.space-create__name-error {
  font-size: $pm-font-support;
  color: $pm-color-danger;
}

// ---- submit ----
.space-create__submit {
  display: flex;
  justify-content: center;
}

.space-create__submit-error {
  display: block;
  margin-top: $pm-space-4;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}
</style>
