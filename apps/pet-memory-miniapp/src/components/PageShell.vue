<template>
  <view
    class="page-shell"
    :class="[`page-shell--${layout}`]"
    :style="shellStyle"
  >
    <!-- header (hidden in quiet-landing) -->
    <view
      v-if="layout !== 'quiet-landing'"
      class="page-shell__header"
    >
      <view class="page-shell__status-bar" :style="statusBarStyle" />
      <view class="page-shell__nav-row" :style="navRowStyle">
        <!-- left slot: back arrow or custom -->
        <view class="page-shell__nav-left" :style="navLeftStyle">
          <slot name="navigation-left">
            <button
              v-if="showBack"
              class="page-shell__back"
              aria-label="返回"
              @click.stop="$emit('back')"
            >
              <text class="page-shell__back-text">返回</text>
            </button>
          </slot>
        </view>

        <!-- centered title -->
        <view class="page-shell__nav-title">
          <slot name="navigation-title">
            <text
              v-if="title"
              class="page-shell__title-text"
            >{{ title }}</text>
          </slot>
        </view>

        <!-- right slot: constrained to avoid WeChat capsule -->
        <view class="page-shell__nav-right" :style="navRightStyle">
          <slot name="navigation-right" />
        </view>
      </view>
    </view>

    <!-- content column (native page scroll) -->
    <view
      class="page-shell__column"
      :class="[`page-shell__column--${layout}`]"
      :style="columnStyle"
    >
      <!-- intro slot -->
      <view v-if="hasIntro" class="page-shell__intro">
        <slot name="intro" />
      </view>

      <!-- main content -->
      <view class="page-shell__content">
        <slot />
      </view>

      <!-- spacer for task-form: pushes actions to bottom -->
      <view
        v-if="layout === 'task-form' && !keyboardOpen"
        class="page-shell__flex-space"
      />

      <!-- actions slot -->
      <view
        v-if="hasActions"
        class="page-shell__actions"
        :class="[`page-shell__actions--${layout}`]"
      >
        <slot name="actions" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { usePlatformLayout } from '../adapters/platform-layout'

export type PageLayout =
  | 'quiet-landing'
  | 'standard-flow'
  | 'task-form'
  | 'reading'

export interface PageShellProps {
  layout: PageLayout
  title?: string
  showBack?: boolean
  keyboardOpen?: boolean
}

const props = withDefaults(defineProps<PageShellProps>(), {
  layout: 'standard-flow',
  showBack: false,
  keyboardOpen: false,
})

defineEmits<{
  back: []
}>()

const slots = getCurrentInstance()!.slots
const platform = usePlatformLayout()

const hasIntro = computed(() => !!slots.intro)
const hasActions = computed(() => !!slots.actions)

const shellStyle = computed(() => {
  if (props.layout === 'quiet-landing') {
    return { paddingTop: `calc(${platform.value.statusBarHeight} + 64rpx)` }
  }
  return {}
})

const statusBarStyle = computed(() => ({
  height: platform.value.statusBarHeight,
}))

const navRowStyle = computed(() => ({
  minHeight: platform.value.navRowHeight,
}))

const navRightStyle = computed(() => ({
  paddingRight: `calc(${platform.value.capsuleWidth} + 16rpx)`,
}))

// When no back button and no custom left slot, balance the capsule offset
// on the right to keep the title visually centered.
const navLeftStyle = computed(() => {
  if (props.showBack || slots['navigation-left']) return {}
  return { paddingLeft: `calc(${platform.value.capsuleWidth} + 16rpx)` }
})

const columnStyle = computed(() => {
  const style: Record<string, string> = {}
  const safeBottom = platform.value.safeBottom

  if (props.layout === 'standard-flow') {
    style.paddingBottom = `calc(${safeBottom} + 64rpx)`
  } else if (props.layout === 'reading') {
    style.paddingBottom = `calc(${safeBottom} + 48rpx)`
  } else if (props.layout === 'task-form') {
    style.paddingBottom = `32rpx`
  }

  if (props.layout === 'task-form' && !props.keyboardOpen) {
    style.minHeight = `calc(100vh - (${headerHeight()}) - ${safeBottom} - var(--pm-page-bottom) - var(--pm-nav-content-gap))`
  }

  return style
})

function headerHeight(): string {
  if (props.layout === 'quiet-landing') return '0px'
  return `${platform.value.statusBarHeight} + ${platform.value.navRowHeight}`
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.page-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $pm-color-canvas;

  &--quiet-landing {
    // padding-top handled by shellStyle inline style
  }
}

// ---- header ----
.page-shell__header {
  position: sticky;
  top: 0;
  z-index: $pm-z-header;
  background-color: $pm-color-canvas;
}

.page-shell__nav-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: $pm-nav-row-height;
  padding-inline: $pm-page-inline;
}

.page-shell__nav-left,
.page-shell__nav-right {
  display: flex;
  align-items: center;
}

.page-shell__nav-left {
  justify-content: flex-start;
}

.page-shell__nav-right {
  justify-content: flex-end;
}

.page-shell__nav-title {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.page-shell__title-text {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-medium;
  line-height: $pm-leading-compact;
  color: $pm-color-ink;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-shell__back {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: $pm-hit-target-min;
  min-height: $pm-hit-target-min;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;

  &::after {
    border: none;
  }
}

.page-shell__back-text {
  font-size: $pm-font-support;
  color: $pm-color-olive;
}

// ---- column ----
.page-shell__column {
  width: 100%;
  max-width: $pm-layout-max-width;
  margin: 0 auto;
  padding-inline: $pm-page-inline;

  &--quiet-landing {
    padding-top: 0;
  }

  &--standard-flow {
    padding-top: $pm-nav-content-gap;
  }

  &--reading {
    padding-top: $pm-nav-content-gap;
  }

  &--task-form {
    display: flex;
    flex-direction: column;
    padding-top: $pm-nav-content-gap;
  }
}

// ---- intro ----
.page-shell__intro {
  margin-bottom: $pm-section-gap;
}

// ---- content ----
.page-shell__content {
  // WXSS 不支持 * 全局选择器，margin-top: 0 已是默认值，无需显式重置
}

// ---- actions ----
.page-shell__actions {
  &--standard-flow {
    margin-top: $pm-section-gap;
  }
}

.page-shell__actions--task-form {
  margin-top: $pm-form-action-gap;
}

.page-shell__flex-space {
  flex: 1;
  min-height: $pm-space-4;
}
</style>
