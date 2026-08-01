<template>
  <button
    class="primary-button"
    :class="[
      `primary-button--${width}`,
      `primary-button--${variant}`,
      {
        'primary-button--disabled': disabled,
        'primary-button--loading': loading,
      },
    ]"
    :disabled="disabled || loading"
    :style="buttonStyle"
    @click.stop="handlePress"
  >
    <text class="primary-button__label">
      <slot v-if="!displayLabel" />
      <template v-else>{{ displayLabel }}</template>
    </text>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

export type PrimaryButtonWidth = 'block' | 'content'
export type PrimaryButtonVariant = 'primary' | 'danger'

export interface PrimaryButtonProps {
  disabled?: boolean
  loading?: boolean
  width?: PrimaryButtonWidth
  variant?: PrimaryButtonVariant
  loadingLabel?: string
}

const LOADING_DELAY_MS = 150
const MIN_DISPLAY_MS = 300

const props = withDefaults(defineProps<PrimaryButtonProps>(), {
  width: 'block',
  variant: 'primary',
  loadingLabel: '保存中…',
})

const emit = defineEmits<{
  press: []
}>()

const visibleLoading = ref(false)
let delayTimer: ReturnType<typeof setTimeout> | null = null
let minDisplayTimer: ReturnType<typeof setTimeout> | null = null
let loadingShownAt = 0

function clearAllTimers() {
  if (delayTimer !== null) { clearTimeout(delayTimer); delayTimer = null }
  if (minDisplayTimer !== null) { clearTimeout(minDisplayTimer); minDisplayTimer = null }
}

onUnmounted(clearAllTimers)

watch(
  () => props.loading,
  (loading) => {
    clearAllTimers()

    if (loading) {
      delayTimer = setTimeout(() => {
        delayTimer = null
        visibleLoading.value = true
        loadingShownAt = Date.now()
      }, LOADING_DELAY_MS)
    } else {
      if (visibleLoading.value) {
        const elapsed = Date.now() - loadingShownAt
        const remaining = MIN_DISPLAY_MS - elapsed
        if (remaining > 0) {
          minDisplayTimer = setTimeout(() => {
            minDisplayTimer = null
            visibleLoading.value = false
          }, remaining)
        } else {
          visibleLoading.value = false
        }
      }
      // If loading ended before 150ms timer fired, visibleLoading was never set
      // and the delay timer is already cleared
    }
  }
)

const displayLabel = computed(() => {
  if (visibleLoading.value && props.loadingLabel) return props.loadingLabel
  return undefined
})

const buttonStyle = computed(() => ({
  minWidth: props.width === 'content' ? '376rpx' : undefined,
}))

function handlePress() {
  if (props.disabled || props.loading) return

  emit('press')
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: $pm-control-height-primary;
  padding-inline: 36rpx;
  border: none;
  border-radius: $pm-radius-sm;
  background-color: $pm-color-olive;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
  line-height: 1.45;
  color: $pm-color-on-primary;
  cursor: pointer;
  transition: background-color $pm-motion-fast $pm-ease-standard;

  &::after {
    border: none;
  }

  &--block {
    width: 100%;
  }

  &--content {
    max-width: 100%;
  }

  // ---- danger variant ----
  &--danger {
    background-color: $pm-color-danger;
  }

  &--danger:active:not(&--disabled):not(&--loading) {
    background-color: $pm-color-danger-pressed;
  }

  &--danger#{&}--disabled,
  &--danger#{&}--loading {
    background-color: $pm-color-olive-soft;
    color: $pm-color-muted;
  }

  &:active:not(&--disabled):not(&--loading):not(&--danger) {
    background-color: $pm-color-olive-pressed;
  }

  &--disabled,
  &--loading {
    background-color: $pm-color-olive-soft;
    color: $pm-color-muted;
  }

  &--loading {
    cursor: default;
  }
}

.primary-button__label {
  font-family: $pm-font-family;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
  line-height: $pm-leading-compact;
  white-space: normal;
  text-align: center;
}
</style>
