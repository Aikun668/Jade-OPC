<template>
  <button
    class="memory-entry"
    :aria-label="item.summary"
    @click.stop="$emit('select', item.id)"
  >
    <view v-if="item.thumbnailUri" class="memory-entry__thumbnail-wrap">
      <image
        class="memory-entry__thumbnail"
        :src="item.thumbnailUri"
        :aria-label="item.thumbnailAlt"
        mode="aspectFill"
      />
    </view>

    <view class="memory-entry__text">
      <text class="memory-entry__summary">{{ item.summary }}</text>
      <text class="memory-entry__date">{{ item.dateLabel }}</text>
    </view>

    <text class="memory-entry__chevron">›</text>
  </button>
</template>

<script setup lang="ts">
import type { MemoryEntryViewModel } from '../features/memories/memory-summary'

export interface MemoryEntryProps {
  item: MemoryEntryViewModel
}

defineProps<MemoryEntryProps>()

defineEmits<{
  select: [memoryId: string]
}>()
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.memory-entry {
  display: flex;
  align-items: center;
  padding-block: 36rpx;
  padding-inline: 0;
  gap: $pm-space-4;
  width: 100%;
  border: none;
  border-bottom: $pm-border-hairline solid $pm-color-line;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &::after {
    border: none;
  }
}

.memory-entry__thumbnail-wrap {
  flex-shrink: 0;
  width: $pm-photo-memory-thumb;
  height: $pm-photo-memory-thumb;
  border-radius: $pm-photo-radius-thumb;
  overflow: hidden;
}

.memory-entry__thumbnail {
  width: 100%;
  height: 100%;
}

.memory-entry__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.memory-entry__summary {
  font-size: $pm-font-body;
  line-height: $pm-leading-compact;
  color: $pm-color-ink;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.memory-entry__date {
  font-size: $pm-font-meta;
  color: $pm-color-muted;
}

.memory-entry__chevron {
  flex-shrink: 0;
  font-size: 44rpx;
  color: $pm-color-muted;
  line-height: 1;
}
</style>
