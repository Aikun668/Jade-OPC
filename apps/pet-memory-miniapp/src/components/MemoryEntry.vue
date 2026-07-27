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
        mode="aspectFill"
      />
    </view>

    <view class="memory-entry__text">
      <text class="memory-entry__summary">{{ item.summary }}</text>
      <text class="memory-entry__date">{{ item.dateLabel }}</text>
    </view>

    <view class="memory-entry__chevron" />
  </button>
</template>

<script setup lang="ts">
export interface MemoryEntryViewModel {
  id: string
  summary: string
  dateLabel: string
  thumbnailUri?: string
  thumbnailAlt?: string
  photoCount?: number
}

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
  align-items: flex-start;
  padding-block: $pm-space-4;
  gap: $pm-space-3;
  width: 100%;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
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
  gap: $pm-space-1;
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
  width: $pm-hit-target-min;
  height: $pm-hit-target-min;
}
</style>
