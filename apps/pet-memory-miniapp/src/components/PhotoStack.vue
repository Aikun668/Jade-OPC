<template>
  <button
    v-if="items.length > 0"
    class="photo-stack"
    aria-label="查看照片"
    @click.stop="handleOpen"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <view class="photo-stack__canvas">
      <!-- third layer (furthest back) -->
      <view
        v-if="items.length >= 3 && thirdLayer"
        class="photo-layer-position photo-layer-position--third"
      >
        <view class="photo-layer-card photo-layer-card--third">
          <image
            v-if="thirdLayer.availability === 'available'"
            class="photo-layer-card__img"
            :src="thirdLayer.uri"
            mode="aspectFill"
          />
          <view v-else class="photo-layer-card__expired" />
        </view>
      </view>

      <!-- second layer -->
      <view
        v-if="items.length >= 2 && secondLayer"
        class="photo-layer-position photo-layer-position--second"
      >
        <view class="photo-layer-card photo-layer-card--second">
          <image
            v-if="secondLayer.availability === 'available'"
            class="photo-layer-card__img"
            :src="secondLayer.uri"
            mode="aspectFill"
          />
          <view v-else class="photo-layer-card__expired" />
        </view>
      </view>

      <!-- front layer -->
      <view class="photo-layer-position photo-layer-position--front">
        <view class="photo-layer-card photo-layer-card--front">
          <image
            v-if="frontLayer.availability === 'available'"
            class="photo-layer-card__img"
            :src="frontLayer.uri"
            mode="aspectFill"
          />
          <view v-else class="photo-layer-card__expired" />
        </view>
      </view>
    </view>

    <!-- count badge -->
    <view v-if="items.length > 1" class="photo-stack__count">
      <text class="photo-stack__count-text">{{ currentIndex + 1 }} / {{ items.length }}</text>
    </view>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PhotoViewModel } from '../features/photos/photo-types'

export interface PhotoStackProps {
  items: PhotoViewModel[]
  initialIndex?: number
}

const props = withDefaults(defineProps<PhotoStackProps>(), {
  initialIndex: 0,
})

const emit = defineEmits<{
  open: [index: number]
  change: [index: number]
}>()

const SWIPE_THRESHOLD = 50

const currentIndex = ref(props.initialIndex)
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipedRecently = ref(false)

const frontLayer = computed(() => props.items[currentIndex.value])

const secondLayer = computed(() => {
  const idx = currentIndex.value + 1
  return idx < props.items.length ? props.items[idx] : null
})

const thirdLayer = computed(() => {
  const idx = currentIndex.value + 2
  return idx < props.items.length ? props.items[idx] : null
})

function onTouchStart(e: any) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  swipedRecently.value = false
}

function onTouchEnd(e: any) {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = e.changedTouches[0].clientY - touchStartY.value

  if (Math.abs(dx) < SWIPE_THRESHOLD) return
  if (Math.abs(dy) > Math.abs(dx)) return

  if (dx < 0 && currentIndex.value < props.items.length - 1) {
    currentIndex.value++
    swipedRecently.value = true
    emit('change', currentIndex.value)
  } else if (dx > 0 && currentIndex.value > 0) {
    currentIndex.value--
    swipedRecently.value = true
    emit('change', currentIndex.value)
  }
}

function handleOpen() {
  if (swipedRecently.value) return
  emit('open', currentIndex.value)
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.photo-stack {
  position: relative;
  width: 100%;
  padding-right: $pm-photo-stack-reserve-x;
  padding-bottom: $pm-photo-stack-reserve-y;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  display: block;

  &::after {
    border: none;
  }
}

.photo-stack__canvas {
  position: relative;
  width: 100%;
  aspect-ratio: #{$pm-photo-detail-ratio}; // 1.18
}

.photo-layer-position {
  position: absolute;
  inset: 0;
  transition: transform $pm-motion-base $pm-ease-standard;
}

.photo-layer-position--second {
  transform: translate(12rpx, 12rpx);
}

.photo-layer-position--third {
  transform: translate(24rpx, 24rpx);
}

.photo-layer-card {
  width: 100%;
  height: 100%;
  transform-origin: bottom right;
  border-radius: $pm-photo-radius-large;
  overflow: hidden;
  transition: transform $pm-motion-base $pm-ease-standard;
}

.photo-layer-card__img {
  width: 100%;
  height: 100%;
}

.photo-layer-card--front {
  transform: none;
}

.photo-layer-card--second {
  transform: rotate(2deg) scale(0.97);
}

.photo-layer-card--third {
  transform: rotate(4deg) scale(0.94);
}

.photo-stack__count {
  position: absolute;
  right: calc(#{$pm-photo-stack-reserve-x} + #{$pm-space-3});
  bottom: $pm-space-3;
  padding: 10rpx 16rpx;
  border-radius: $pm-radius-sm;
  background: $pm-photo-count-badge-bg;
}

.photo-layer-card__expired {
  width: 100%;
  height: 100%;
  background: $pm-color-olive-soft;
}

.photo-stack__count-text {
  font-size: $pm-font-meta;
  color: $pm-color-on-primary;
}
</style>
