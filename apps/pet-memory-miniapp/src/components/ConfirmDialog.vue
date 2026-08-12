<template>
  <view
    v-if="open"
    class="confirm-dialog-root"
    @touchmove.stop.prevent
  >
    <view class="confirm-dialog__mask" />
    <view
      class="confirm-dialog__panel"
      :class="{ 'confirm-dialog__panel--list': actionLayout === 'list' }"
    >
      <text class="confirm-dialog__title">{{ title }}</text>
      <text v-if="description" class="confirm-dialog__desc">{{ description }}</text>

      <!-- error message -->
      <text v-if="error" class="confirm-dialog__error">{{ error }}</text>

      <view
        v-if="actionLayout === 'list'"
        class="confirm-dialog__action-list"
      >
        <TextAction
          v-for="action in listActions"
          :key="action.key"
          :class="[
            'confirm-dialog__list-action',
            `confirm-dialog__list-action--${action.role}`,
          ]"
          :tone="action.tone"
          :disabled="pendingPhase !== 'idle'"
          @press="pendingPhase === 'idle' && handleListAction(action.key)"
        >
          {{ action.label }}
        </TextAction>
      </view>

      <view v-else class="confirm-dialog__actions">
        <PrimaryButton
          :loading="pendingPhase === 'pending-visible'"
          :loading-label="pendingPhase !== 'idle' ? pendingLabel : undefined"
          :variant="tone === 'danger' ? 'danger' : 'primary'"
          @press="pendingPhase === 'idle' && $emit('confirm')"
        >
          {{ confirmLabel }}
        </PrimaryButton>
        <TextAction
          v-if="discardLabel"
          :disabled="pendingPhase === 'pending-visible'"
          @press="pendingPhase === 'idle' && $emit('discard')"
        >
          {{ discardLabel }}
        </TextAction>
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
type ConfirmDialogListAction = 'confirm' | 'discard' | 'cancel'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  discardLabel?: string
  actionLayout?: 'default' | 'list'
  listOrder?: 'confirm-discard-cancel' | 'confirm-cancel-discard'
  tone?: ConfirmDialogTone
  pending?: boolean
  error?: string
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  actionLayout: 'default',
  listOrder: 'confirm-discard-cancel',
  tone: 'default',
  pending: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  discard: []
  closed: []
}>()

const PENDING_HIDDEN_MS = 150

const listActions = computed(() => {
  const actions: Array<{
    key: ConfirmDialogListAction
    role: 'primary' | 'secondary' | 'cancel'
    label: string
    tone?: 'default' | 'muted' | 'danger'
  }> = [
    {
      key: 'confirm',
      role: 'primary',
      label: props.confirmLabel,
      tone: props.tone === 'danger' ? 'danger' : 'default',
    },
  ]

  if (props.listOrder === 'confirm-cancel-discard') {
    actions.push({ key: 'cancel', role: 'cancel', label: props.cancelLabel, tone: 'muted' })
    if (props.discardLabel) {
      actions.push({ key: 'discard', role: 'secondary', label: props.discardLabel })
    }
  } else {
    if (props.discardLabel) {
      actions.push({ key: 'discard', role: 'secondary', label: props.discardLabel })
    }
    actions.push({ key: 'cancel', role: 'cancel', label: props.cancelLabel, tone: 'muted' })
  }

  return actions
})

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

function handleListAction(action: ConfirmDialogListAction) {
  if (action === 'confirm') emit('confirm')
  if (action === 'discard') emit('discard')
  if (action === 'cancel') handleCancel()
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

.confirm-dialog__panel--list {
  align-items: center;
  text-align: center;

  .confirm-dialog__title {
    font-size: $pm-font-section-title;
    line-height: $pm-leading-title;
  }
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

.confirm-dialog__action-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-top: $pm-space-4;

  :deep(.confirm-dialog__list-action) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: $pm-control-height-regular;
    padding-inline: $pm-space-5;
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    color: $pm-color-ink;
    font-size: $pm-font-body;
  }

  :deep(.confirm-dialog__list-action + .confirm-dialog__list-action) {
    border-top: none;
  }

  :deep(.confirm-dialog__list-action + .confirm-dialog__list-action)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 26%;
    width: 48%;
    border-top: $pm-border-hairline solid $pm-color-line;
  }

  :deep(.confirm-dialog__list-action--primary) {
    color: $pm-color-olive;
    font-weight: $pm-weight-medium;
  }

  :deep(.confirm-dialog__list-action--secondary) {
    color: $pm-color-ink;
  }

  :deep(.confirm-dialog__list-action--cancel) {
    color: $pm-color-muted;
  }

  :deep(.confirm-dialog__list-action--disabled) {
    color: $pm-color-muted;
  }

  :deep(.text-action__label) {
    font-size: $pm-font-body;
    text-align: center;
  }
}

</style>
