<template>
  <view class="draft-notice">
    <image
      v-if="materialLoaded !== false"
      class="draft-notice__material"
      src="/ui/draft-paper-reference-v5-cropped.png"
      mode="scaleToFill"
      @error="materialLoaded = false"
      @load="materialLoaded = true"
    />
    <image
      class="draft-notice__tape"
      src="/ui/draft-tape-antique-v3-cropped.png"
      mode="aspectFit"
      aria-hidden="true"
    />
    <view class="draft-notice__content">
      <text class="draft-notice__title">{{ title }}</text>
      <button
        class="draft-notice__continue-btn"
        @click.stop="emit('continue')"
      >
        <text class="draft-notice__continue-label">{{ continueLabel }}</text>
        <image
          class="draft-notice__arrow-icon"
          src="/ui/draft-arrow.svg"
          mode="aspectFit"
        />
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface DraftNoticeProps {
  title: string
  continueLabel?: string
}

withDefaults(defineProps<DraftNoticeProps>(), {
  continueLabel: '继续写',
})

const emit = defineEmits<{
  continue: []
}>()

const materialLoaded = ref<boolean | null>(null)
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.draft-notice {
  position: relative;
  display: flex;
  align-items: center;
  width: $pm-draft-notice-width;
  max-width: 100%;
  min-height: $pm-draft-notice-height;
  box-sizing: border-box;
  padding: $pm-space-6 $pm-space-1 $pm-space-6 $pm-draft-notice-padding-left;
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: visible;
}

.draft-notice__tape {
  position: absolute;
  z-index: 3;
  top: -24rpx;
  left: -12rpx;
  width: 160rpx;
  height: 88rpx;
}

.draft-notice__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $pm-space-3;
  width: 100%;
  min-width: 0;
}

.draft-notice__material {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
}

.draft-notice__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: $pm-font-body;
  color: $pm-color-ink;
}

.draft-notice__continue-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: $pm-space-2;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: -$pm-space-1;
  min-height: $pm-hit-target-min;
  padding-inline: $pm-space-2;
  border: none;
  background: none;
  font-size: $pm-font-body;
  color: $pm-color-olive;
  cursor: pointer;

  &::after {
    border: none;
  }

  &:active {
    background-color: $pm-color-olive-soft;
  }
}

.draft-notice__continue-label {
  font-family: $pm-font-family;
  font-size: 28rpx;
  font-weight: $pm-weight-regular;
  line-height: $pm-leading-compact;
  color: $pm-color-olive;
}

.draft-notice__arrow-icon {
  width: $pm-icon-sm;
  height: $pm-icon-sm;
  flex-shrink: 0;
}
</style>
