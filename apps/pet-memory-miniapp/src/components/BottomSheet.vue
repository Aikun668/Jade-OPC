<template>
  <view
    v-if="open"
    class="bottom-sheet-root"
    @touchmove.stop.prevent
  >
    <view
      class="bottom-sheet__mask"
      :class="{ 'bottom-sheet__mask--interactive': closeOnMask }"
      @click.stop="closeOnMask && !pending && $emit('close')"
    />

    <view class="bottom-sheet__panel">
      <text v-if="title" class="bottom-sheet__title">{{ title }}</text>
      <text v-if="description" class="bottom-sheet__desc">{{ description }}</text>

      <text v-if="error" class="bottom-sheet__error">{{ error }}</text>

      <view class="bottom-sheet__body">
        <slot />
      </view>

      <view v-if="$slots.actions" class="bottom-sheet__actions">
        <slot name="actions" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue'

export interface BottomSheetProps {
  open: boolean
  title?: string
  description?: string
  closeOnMask?: boolean
  pending?: boolean
  error?: string
}

const props = withDefaults(defineProps<BottomSheetProps>(), {
  closeOnMask: true,
  pending: false,
})

const emit = defineEmits<{
  close: []
  closed: []
}>()

watch(() => props.open, (val) => {
  if (!val) emit('closed')
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.bottom-sheet-root {
  position: fixed;
  inset: 0;
  z-index: $pm-z-sheet;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet__mask {
  position: absolute;
  inset: 0;
  background: $pm-color-overlay;
}

.bottom-sheet__mask--interactive {
  cursor: pointer;
}

.bottom-sheet__panel {
  position: relative;
  width: 100%;
  max-width: $pm-layout-max-width;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: $pm-color-surface;
  padding-top: $pm-space-6;
  padding-inline: $pm-space-5;
  padding-bottom: calc(var(--pm-safe-bottom, 0px) + #{$pm-space-4});
  border-top-left-radius: $pm-radius-dialog;
  border-top-right-radius: $pm-radius-dialog;
}

.bottom-sheet__title {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
  margin-bottom: $pm-space-2;
}

.bottom-sheet__desc {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: $pm-leading-body;
  margin-bottom: $pm-space-4;
}

.bottom-sheet__error {
  font-size: $pm-font-support;
  color: $pm-color-danger;
  line-height: $pm-leading-body;
  margin-bottom: $pm-space-4;
}

.bottom-sheet__body {
  overflow-y: auto;
}

.bottom-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  margin-top: $pm-space-4;
}
</style>
