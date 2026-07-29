<template>
  <view
    v-if="open"
    class="photo-viewer"
    @touchmove.stop.prevent
  >
    <!-- header -->
    <view class="photo-viewer__header">
      <button
        class="photo-viewer__close"
        aria-label="关闭"
        @click.stop="$emit('close')"
      >
        <text class="photo-viewer__close-text">关闭</text>
      </button>
      <text class="photo-viewer__count">
        {{ currentIndex + 1 }} / {{ items.length }}
      </text>
    </view>

    <!-- main image -->
    <view class="photo-viewer__body">
      <swiper
        class="photo-viewer__swiper"
        :current="currentIndex"
        @change="handleSwipe"
      >
        <swiper-item
          v-for="item in items"
          :key="item.id"
          class="photo-viewer__item"
        >
          <image
            v-if="item.availability === 'available'"
            class="photo-viewer__image"
            :src="item.uri"
            mode="aspectFit"
          />
          <view v-else class="photo-viewer__expired-placeholder" />
        </swiper-item>
      </swiper>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PhotoViewModel } from '../features/photos/photo-types'

export interface PhotoViewerProps {
  open: boolean
  items: PhotoViewModel[]
  initialIndex: number
}

const props = defineProps<PhotoViewerProps>()

const emit = defineEmits<{
  close: []
  change: [index: number]
}>()

const currentIndex = ref(props.initialIndex)

watch(() => props.initialIndex, (val) => {
  currentIndex.value = val
})

function handleSwipe(e: { detail: { current: number } }) {
  currentIndex.value = e.detail.current
  emit('change', e.detail.current)
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: $pm-z-viewer;
  background: $pm-photo-viewer-bg;
  display: flex;
  flex-direction: column;
}

.photo-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: $pm-space-5;
  padding-top: var(--pm-status-bar-height, 0);
  height: calc(#{$pm-nav-row-height} + var(--pm-status-bar-height, 0px));
}

.photo-viewer__close {
  display: flex;
  align-items: center;
  min-width: $pm-hit-target-min;
  min-height: $pm-hit-target-min;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
}

.photo-viewer__close-text {
  font-size: $pm-font-support;
  color: $pm-color-on-primary;
}

.photo-viewer__count {
  font-size: $pm-font-meta;
  color: $pm-color-on-primary;
}

.photo-viewer__body {
  flex: 1;
  display: flex;
  align-items: center;
}

.photo-viewer__swiper {
  width: 100%;
  height: 70vh;
}

.photo-viewer__item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $pm-space-5;
}

.photo-viewer__image {
  width: 100%;
  height: 100%;
}

.photo-viewer__expired-placeholder {
  width: 100%;
  height: 100%;
  background: $pm-color-olive-soft;
}
</style>
