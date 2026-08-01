<template>
  <view class="draft-notice">
    <!-- paper material image layer -->
    <image
      v-if="materialLoaded !== false"
      class="draft-notice__material"
      src="/ui/draft-notice-paper.png"
      mode="aspectFill"
      @error="materialLoaded = false"
      @load="materialLoaded = true"
    />

    <!-- content overlay -->
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
  width: 100%;
  min-height: 192rpx;
  padding-block: $pm-space-6;
  padding-inline: $pm-space-6;
  border-radius: $pm-radius-sm;
  background: $pm-color-surface;
  border: $pm-border-hairline solid $pm-color-line;
  box-shadow: $pm-shadow-paper;
  overflow: hidden;
}

.draft-notice__material {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.draft-notice__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $pm-space-4;
  min-height: calc(192rpx - #{$pm-space-6} * 2);
}

.draft-notice__title {
  font-size: $pm-font-body;
  color: $pm-color-ink;
  flex-shrink: 1;
}

.draft-notice__continue-btn {
  display: inline-flex;
  align-items: center;
  gap: $pm-space-2;
  flex-shrink: 0;
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
  font-size: $pm-font-body;
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
