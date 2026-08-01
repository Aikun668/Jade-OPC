<template>
  <view class="memory-list">
    <!-- empty state -->
    <view v-if="items.length === 0" class="memory-list__empty">
      <slot name="empty" />
    </view>

    <!-- items -->
    <template v-else>
      <MemoryEntry
        v-for="item in items"
        :key="item.id"
        :item="item"
        @select="(id: string) => $emit('select', id)"
      />

      <!-- footer -->
      <view v-if="$slots.footer" class="memory-list__footer">
        <slot name="footer" />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { MemoryEntryViewModel } from '../features/memories/memory-summary'
import MemoryEntry from './MemoryEntry.vue'

export interface MemoryListProps {
  items: MemoryEntryViewModel[]
}

defineProps<MemoryListProps>()

defineEmits<{
  select: [memoryId: string]
}>()
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.memory-list__empty {
  padding-block: $pm-space-8;
}

.memory-list__footer {
  margin-top: 0;
}
</style>
