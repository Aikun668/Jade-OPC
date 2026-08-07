<template>
  <PageShell layout="quiet-landing">
    <!-- bootstrap pending — show a visible loading indicator so the page never looks blank -->
    <template v-if="isBootstrapping">
      <view class="onboarding__pending">
        <text class="onboarding__pending-label">正在准备…</text>
      </view>
    </template>

    <!-- error -->
    <template v-else-if="isError">
      <view class="onboarding__center">
        <text class="onboarding__error-label">暂时没有准备好，可以再试一次。</text>
        <view class="onboarding__action">
          <PrimaryButton width="content" @press="retry">再试一次</PrimaryButton>
        </view>
      </view>
    </template>

    <!-- ready: keep the mark and introduction in one visual flow -->
    <template v-else-if="showContent">
      <view class="onboarding__content">
        <view class="onboarding__mark" aria-hidden="true">
          <view class="onboarding__mark-inner" />
        </view>
        <view class="onboarding__intro">
          <text class="onboarding__eyebrow">宠物记忆</text>
          <text class="onboarding__title">给 Ta 留一个安静的位置</text>
          <text class="onboarding__body">把想记住的样子、习惯和小事，慢慢留在这里。你可以只看看，也可以只写下一句话。</text>
        </view>
        <view class="onboarding__note">
          <view class="onboarding__lock-icon" aria-hidden="true">
            <view class="onboarding__lock-shackle" />
            <view class="onboarding__lock-body">
              <view class="onboarding__lock-keyhole" />
            </view>
          </view>
          <text class="onboarding__note-text">这里默认只属于你。M0 只保存本地文字，照片仅用于这次预览。</text>
        </view>
      </view>
    </template>

    <!-- fallback: redirecting (hasCompletedOnboarding=true) or unexpected state -->
    <template v-else>
      <view class="onboarding__pending">
        <text class="onboarding__pending-label">正在准备…</text>
      </view>
    </template>

    <template #actions>
      <template v-if="showContent">
        <view class="onboarding__start">
          <PrimaryButton
            width="block"
            :loading="isSubmitting"
            loading-label="正在准备…"
            @press="start"
          >开始</PrimaryButton>
        </view>
        <text v-if="submitError" class="onboarding__error">刚才没有准备好，可以再试一次。</text>
        <view class="onboarding__privacy">
          <TextAction @press="goPrivacy">先看看隐私说明</TextAction>
        </view>
      </template>
    </template>
    <DevPanel />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import DevPanel from '../../components/DevPanel.vue'
import { useAppStore } from '../../stores/app'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'

const appStore = useAppStore()
const nav = getNavigation()

const isSubmitting = ref(false)
const submitError = ref(false)
let didRedirect = false

const isBootstrapping = computed(() =>
  appStore.bootstrapStatus === 'idle' || appStore.bootstrapStatus === 'loading',
)

const isError = computed(() => appStore.bootstrapStatus === 'error')

const showContent = computed(() =>
  appStore.bootstrapStatus === 'ready' && !appStore.hasCompletedOnboarding,
)

// Redirect to spaces if onboarding already completed
watch(
  () => appStore.bootstrapStatus,
  (status) => {
    if (didRedirect) return
    if (status === 'ready' && appStore.hasCompletedOnboarding) {
      didRedirect = true
      nav.resetTo({ page: 'spaces' })
    }
  },
  { immediate: true },
)

async function start(): Promise<void> {
  submitError.value = false
  isSubmitting.value = true
  try {
    await appStore.completeOnboarding()
    await nav.push(PAGE_URLS['space-create'])
  } catch {
    submitError.value = true
  } finally {
    isSubmitting.value = false
  }
}

function goPrivacy(): void {
  nav.push(`${PAGE_URLS.privacy}?source=onboarding`)
}

function retry(): void {
  appStore.bootstrap()
}
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

// ---- decorative mark ----
.onboarding__mark {
  display: grid;
  place-items: center;
  width: 112rpx;
  height: 112rpx;
  margin-bottom: 56rpx;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: 50%;
}

.onboarding__mark-inner {
  width: 36rpx;
  height: 36rpx;
  border: $pm-border-hairline solid $pm-color-olive;
  border-radius: 50%;
  box-shadow: 16rpx 12rpx 0 -10rpx $pm-color-olive;
}

.onboarding__content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

// ---- intro ----
.onboarding__intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $pm-space-3;
  text-align: left;
}

.onboarding__eyebrow {
  font-size: $pm-font-support;
  font-weight: $pm-weight-medium;
  letter-spacing: 4rpx;
  color: $pm-color-muted;
}

.onboarding__title {
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.onboarding__body {
  font-size: $pm-font-body;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

// ---- privacy note ----
.onboarding__note {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
  margin-top: $pm-section-gap;
  padding: 30rpx 32rpx;
  background: $pm-color-olive-soft;
  border-radius: $pm-radius-md;
}

.onboarding__lock-icon {
  flex: 0 0 auto;
  width: 34rpx;
  height: 40rpx;
  margin-top: 2rpx;
  position: relative;
}

.onboarding__lock-shackle {
  position: absolute;
  top: 0;
  left: 8rpx;
  width: 18rpx;
  height: 18rpx;
  border: 2rpx solid $pm-color-olive;
  border-bottom: none;
  border-radius: 12rpx 12rpx 0 0;
  box-sizing: border-box;
}

.onboarding__lock-body {
  position: absolute;
  top: 14rpx;
  left: 2rpx;
  width: 30rpx;
  height: 24rpx;
  border: 2rpx solid $pm-color-olive;
  border-radius: 4rpx;
  box-sizing: border-box;
}

.onboarding__lock-keyhole {
  position: absolute;
  top: 6rpx;
  left: 50%;
  width: 4rpx;
  height: 8rpx;
  transform: translateX(-50%);
  border-radius: 4rpx;
  background: $pm-color-olive;
}

.onboarding__note-text {
  flex: 1;
  font-size: $pm-font-support;
  line-height: 1.65;
  color: $pm-color-muted;
}

// ---- actions ----
.onboarding__start {
  margin-top: $pm-section-gap;
  display: flex;
  width: 100%;

  :deep(.primary-button) {
    flex: 1 1 auto;
    width: 100%;
    box-sizing: border-box;
  }

  :deep(primary-button) {
    flex: 1 1 auto;
    display: block;
    width: 100%;
  }
}

.onboarding__error {
  display: block;
  margin-top: $pm-space-3;
  font-size: $pm-font-support;
  color: $pm-color-danger;
  text-align: center;
}

.onboarding__privacy {
  margin-top: $pm-space-6;
  display: flex;
  justify-content: center;
}

// ---- pending & error ----
.onboarding__pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.onboarding__pending-label {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.onboarding__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
  gap: $pm-space-2;
}

.onboarding__error-label {
  font-size: $pm-font-body;
  color: $pm-color-muted;
  text-align: center;
}

.onboarding__action {
  margin-top: $pm-space-6;
}
</style>
