<template>
  <view class="form-field">
    <!-- label row -->
    <view class="form-field__label-row">
      <text class="form-field__label">{{ label }}</text>
      <view v-if="$slots.trailing" class="form-field__trailing">
        <slot name="trailing" />
      </view>
    </view>

    <!-- control area -->
    <view class="form-field__control">
      <slot />
    </view>

    <!-- help or error message -->
    <view v-if="displayMessage" class="form-field__message">
      <text
        class="form-field__message-text"
        :class="{ 'form-field__message-text--error': error }"
      >
        {{ displayMessage }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FormFieldProps {
  label: string
  help?: string
  error?: string
}

const props = defineProps<FormFieldProps>()

const displayMessage = computed(() => {
  return props.error || props.help || ''
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.form-field {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;

  & + & {
    margin-top: $pm-content-gap;
  }
}

.form-field__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-field__label {
  font-size: $pm-font-support;
  font-weight: $pm-weight-medium;
  color: $pm-color-ink;
}

.form-field__control {
  > textarea,
  > input {
    width: 100%;
    min-height: $pm-control-height-regular;
    padding-inline: $pm-space-3;
    border: $pm-border-hairline solid $pm-color-line;
    border-radius: $pm-radius-sm;
    background-color: $pm-color-surface;
    font-family: $pm-font-family;
    font-size: $pm-font-body;
    color: $pm-color-ink;
    outline: none;
    box-sizing: border-box;
    transition: border-color $pm-motion-fast $pm-ease-standard;
  }

  > textarea {
    padding: $pm-space-4;
    min-height: $pm-textarea-regular;
  }

  > input {
    padding-block: 0;
  }

  &:focus-within {
    > textarea,
    > input {
      border-color: $pm-color-olive;
    }
  }
}

.form-field__message-text {
  font-size: $pm-font-support;
  line-height: $pm-leading-compact;
  color: $pm-color-muted;

  &--error {
    color: $pm-color-danger;
  }
}
</style>
