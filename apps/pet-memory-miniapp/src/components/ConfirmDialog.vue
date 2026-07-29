<template>
  <view
    v-if="open"
    class="confirm-dialog-root"
    @touchmove.stop.prevent
  >
    <view class="confirm-dialog__mask" />
    <view class="confirm-dialog__panel">
      <text class="confirm-dialog__title">{{ title }}</text>
      <text v-if="description" class="confirm-dialog__desc">{{ description }}</text>

      <!-- error message -->
      <text v-if="error" class="confirm-dialog__error">{{ error }}</text>

      <view class="confirm-dialog__actions">
        <PrimaryButton
          :loading="pendingPhase === 'pending-visible'"
          :loading-label="pendingPhase !== 'idle' ? pendingLabel : undefined"
          :variant="tone === 'danger' ? 'danger' : 'primary'"
          @press="pendingPhase === 'idle' && $emit('confirm')"
        >
          {{ confirmLabel }}
        </PrimaryButton>
        <TextAction
          tone="muted"
          :disabled="pendingPhase === 'pending-visible'"
          @press="handleCancel"
        >
          {{ cancelLabel }}
        </TextAction>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import PrimaryButton from './PrimaryButton.vue'
import TextAction from './TextAction.vue'

export type ConfirmDialogTone = 'default' | 'danger'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  tone?: ConfirmDialogTone
  pending?: boolean
  error?: string
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  tone: 'default',
  pending: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  closed: []
}>()

const PENDING_HIDDEN_MS = 150

const pendingPhase = ref<'idle' | 'pending-hidden' | 'pending-visible'>('idle')
let pendingTimer: ReturnType<typeof setTimeout> | null = null

function clearPendingTimer() {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
}

watch(() => props.pending, (val) => {
  clearPendingTimer()
  if (val) {
    pendingPhase.value = 'pending-hidden'
    pendingTimer = setTimeout(() => {
      pendingPhase.value = 'pending-visible'
      pendingTimer = null
    }, PENDING_HIDDEN_MS)
  } else {
    pendingPhase.value = 'idle'
  }
}, { immediate: true })

watch(() => props.open, (val) => {
  if (!val) {
    clearPendingTimer()
    pendingPhase.value = 'idle'
    emit('closed')
  }
})

onBeforeUnmount(() => {
  clearPendingTimer()
})

const pendingLabel = computed(() => {
  return props.tone === 'danger' ? '正在删除...' : '保存中...'
})

function handleCancel() {
  if (pendingPhase.value !== 'idle') return
  emit('cancel')
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.confirm-dialog-root {
  position: fixed;
  inset: 0;
  z-index: $pm-z-dialog;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog__mask {
  position: absolute;
  inset: 0;
  background: $pm-color-overlay;
}

.confirm-dialog__panel {
  position: relative;
  width: calc(100% - #{$pm-space-10});
  max-width: $pm-dialog-max-width;
  padding: $pm-space-6;
  border-radius: $pm-radius-dialog;
  background: $pm-color-surface;
  box-shadow: $pm-shadow-paper;
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
}

.confirm-dialog__title {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
  line-height: $pm-leading-compact;
}

.confirm-dialog__desc {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: $pm-leading-body;
}

.confirm-dialog__error {
  font-size: $pm-font-support;
  color: $pm-color-danger;
  line-height: $pm-leading-body;
}

.confirm-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  margin-top: $pm-space-4;
}
</style>
