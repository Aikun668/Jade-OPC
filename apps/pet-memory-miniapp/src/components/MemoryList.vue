<template>
  <view class="memory-list">
    <!-- empty state -->
    <view v-if="items.length === 0" class="memory-list__empty">
      <slot name="empty" />
    </view>

    <!-- items -->
    <template v-else>
      <view
        v-for="(item, index) in items"
        :key="item.id"
      >
        <!-- divider (not before first item) -->
        <view
          v-if="index > 0"
          class="memory-list__divider"
        />
        <MemoryEntry
          :item="item"
          @select="(id: string) => $emit('select', id)"
        />
      </view>

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

.memory-list__divider {
  height: $pm-border-hairline;
  background-color: $pm-color-line;
}

.memory-list__empty {
  padding-block: $pm-space-8;
}

.memory-list__footer {
  margin-top: $pm-space-4;
}
</style>
