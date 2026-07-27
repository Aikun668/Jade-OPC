<!--
  DevPanel — M0 development-only scenario switcher.
  Per spec 6.14: MUST be tree-shaken from production build.
  The v-if guard uses import.meta.env.DEV which Vite statically
  evaluates — dead-code elimination removes this entire component
  and its imports from production bundles.
-->
<template>
  <view v-if="isDev" class="dev-panel">
    <view class="dev-panel__toggle" @click.stop="expanded = !expanded">
      <text class="dev-panel__toggle-text">DEV</text>
    </view>

    <view v-if="expanded" class="dev-panel__body">
      <view class="dev-panel__section">
        <text class="dev-panel__section-title">场景切换</text>
        <slot name="scenarios" />
      </view>

      <view class="dev-panel__section">
        <text class="dev-panel__section-title">失败场景</text>
        <slot name="failures" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isDev = import.meta.env.DEV
const expanded = ref(false)
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.dev-panel {
  position: fixed;
  right: $pm-space-3;
  bottom: calc(var(--pm-safe-bottom, 0px) + #{$pm-space-16});
  z-index: $pm-z-header;
}

.dev-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: $pm-radius-round;
  background: $pm-color-overlay;
}

.dev-panel__toggle-text {
  font-size: $pm-font-meta;
  font-weight: $pm-weight-semibold;
  color: $pm-color-on-primary;
}

.dev-panel__body {
  position: absolute;
  right: 0;
  bottom: calc(100% + #{$pm-space-2});
  width: 320rpx;
  padding: $pm-space-4;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
  box-shadow: $pm-shadow-paper;
  display: flex;
  flex-direction: column;
  gap: $pm-space-4;
}

.dev-panel__section-title {
  display: block;
  font-size: $pm-font-meta;
  font-weight: $pm-weight-medium;
  color: $pm-color-muted;
  margin-bottom: $pm-space-2;
}
</style>
