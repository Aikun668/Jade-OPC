<template>
  <view class="missing-content">
    <text class="missing-content__title">
      {{ displayTitle }}
    </text>
    <text class="missing-content__description">
      {{ description }}
    </text>
    <view class="missing-content__action">
      <slot name="action">
        <PrimaryButton
          width="content"
          :loading-label="actionLabel"
          @press="$emit('action')"
        >
          {{ actionLabel }}
        </PrimaryButton>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PrimaryButton from './PrimaryButton.vue'

export interface MissingContentStateProps {
  title?: string
  description: string
  actionLabel: string
}

const props = defineProps<MissingContentStateProps>()

defineEmits<{
  action: []
}>()

const displayTitle = computed(() => {
  return props.title || '这段内容已经不在这里'
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.missing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
  gap: $pm-space-2;
}

.missing-content__title {
  font-size: $pm-font-section-title;
  font-weight: $pm-weight-medium;
  color: $pm-color-ink;
}

.missing-content__description {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.missing-content__action {
  margin-top: $pm-space-6;
}
</style>
