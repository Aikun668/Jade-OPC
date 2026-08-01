<template>
  <view class="draft-notice">
    <image
      v-if="materialLoaded !== false"
      class="draft-notice__material"
      src="/ui/draft-notice-paper.png"
      mode="aspectFill"
      @error="materialLoaded = false"
      @load="materialLoaded = true"
    />
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
  justify-content: space-between;
  width: 100%;
  min-height: 168rpx;
  padding: 44rpx 36rpx;
  background: $pm-color-surface;
  border: 1px solid rgba(223, 221, 208, 0.78);
  border-bottom-color: transparent;
  border-radius: 2rpx 3rpx 5rpx 4rpx;
  box-shadow: 0 18rpx 44rpx rgba(57, 58, 49, 0.055);
  overflow: hidden;

  // tape tear at top-left
  &::before {
    position: absolute;
    z-index: 2;
    top: -18rpx;
    left: -10rpx;
    width: 116rpx;
    height: 32rpx;
    background:
      linear-gradient(88deg, rgba(255, 253, 248, 0.18), transparent 34%, rgba(57, 58, 49, 0.025) 72%, transparent),
      rgba(222, 214, 181, 0.62);
    border-radius: 2rpx 4rpx 4rpx 2rpx;
    clip-path: polygon(1% 14%, 96% 0, 100% 82%, 91% 96%, 5% 100%, 0 26%);
    transform: rotate(-1.8deg);
    content: "";
  }

  // torn bottom edge
  &::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    z-index: 2;
    height: 20rpx;
    background: $pm-color-canvas;
    clip-path: polygon(
      0 68%,
      7% 34%,
      15% 64%,
      25% 19%,
      37% 58%,
      51% 12%,
      63% 61%,
      77% 25%,
      89% 67%,
      100% 38%,
      100% 100%,
      0 100%
    );
    content: "";
  }
}

.draft-notice__material {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.draft-notice__title {
  position: relative;
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
