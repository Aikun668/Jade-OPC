<template>
  <button
    class="text-action"
    :class="[
      `text-action--${tone}`,
      { 'text-action--disabled': disabled },
    ]"
    :disabled="disabled"
    @click.stop="handlePress"
  >
    <text class="text-action__label">
      <slot />
    </text>
  </button>
</template>

<script setup lang="ts">
export type TextActionTone = 'default' | 'muted' | 'danger'

export interface TextActionProps {
  tone?: TextActionTone
  disabled?: boolean
}

const props = withDefaults(defineProps<TextActionProps>(), {
  tone: 'default',
})

const emit = defineEmits<{
  press: []
}>()

function handlePress() {
  if (props.disabled) return
  emit('press')
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.text-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: $pm-control-height-regular;
  min-width: $pm-hit-target-min;
  padding-inline: $pm-space-2;
  border: none;
  background: none;
  font-size: $pm-font-support;
  font-weight: $pm-weight-regular;
  line-height: $pm-leading-compact;
  cursor: pointer;
  transition: background-color $pm-motion-fast $pm-ease-standard;

  &::after {
    border: none;
  }

  &--default {
    color: $pm-color-olive;
  }

  &--muted {
    color: $pm-color-muted;
  }

  &--danger {
    color: $pm-color-danger;
  }

  &:active:not(&--disabled) {
    background-color: $pm-color-olive-soft;
  }

  &--disabled {
    color: $pm-color-muted;
    cursor: default;
  }
}

.text-action__label {
  font-family: $pm-font-family;
  font-size: $pm-font-support;
  font-weight: $pm-weight-regular;
  line-height: $pm-leading-compact;
  text-align: center;
  text-decoration: none;
}
</style>
