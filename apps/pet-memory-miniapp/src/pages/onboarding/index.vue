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

    <!-- ready: a single immersive memory scene, with the entry action inside it -->
    <template v-else-if="showContent">
      <view class="onboarding__content">
        <image
          class="onboarding__scene"
          src="/static/ui/onboarding-photo-album-hero-v2.png"
          mode="aspectFill"
          aria-hidden="true"
        />
        <view class="onboarding__shade" aria-hidden="true" />
        <view class="onboarding__copy">
          <text class="onboarding__brand">宠物记忆</text>
          <view class="onboarding__intro">
            <text class="onboarding__title">给 Ta 留一个安静的位置</text>
            <text class="onboarding__body">把想记住的样子，慢慢留在这里。</text>
          </view>
        </view>
        <view class="onboarding__footer">
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
            <TextAction class="onboarding__privacy-link" @press="goPrivacy">隐私说明</TextAction>
            <text class="onboarding__privacy-copy"> · 默认仅存于本机</text>
          </view>
        </view>
      </view>
    </template>

    <!-- fallback: redirecting (hasCompletedOnboarding=true) or unexpected state -->
    <template v-else>
      <view class="onboarding__pending">
        <text class="onboarding__pending-label">正在准备…</text>
      </view>
    </template>

    <DevPanel />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onReady } from '@dcloudio/uni-app'
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
let pageReady = false

const isBootstrapping = computed(() =>
  appStore.bootstrapStatus === 'idle' || appStore.bootstrapStatus === 'loading',
)

const isError = computed(() => appStore.bootstrapStatus === 'error')

const showContent = computed(() =>
  appStore.bootstrapStatus === 'ready' && !appStore.hasCompletedOnboarding,
)

function redirectIfReady(): void {
  if (didRedirect || !pageReady) return
  if (appStore.bootstrapStatus !== 'ready' || !appStore.hasCompletedOnboarding) return

  didRedirect = true
  // Wait until the bootstrap page has completed its first render before
  // replacing it. Navigating earlier can make the WeChat renderer treat the
  // first page data as an update and emit a framework-level error.
  void nav.replace(PAGE_URLS.spaces).catch(() => {
    didRedirect = false
  })
}

// Redirect to spaces only after the bootstrap page is ready for its first
// render. The watcher handles the case where bootstrap finishes afterwards.
onReady(() => {
  pageReady = true
  redirectIfReady()
})

watch(
  () => appStore.bootstrapStatus,
  () => redirectIfReady(),
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

.onboarding__content {
  position: relative;
  display: flex;
  width: calc(100% + #{$pm-page-inline * 2});
  min-height: 100vh;
  margin-inline: -$pm-page-inline;
  overflow: hidden;
  background: $pm-color-ink;
}

.onboarding__scene,
.onboarding__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.onboarding__scene {
  object-fit: cover;
}

.onboarding__shade {
  background: linear-gradient(180deg, rgba(40, 38, 30, 0.06) 28%, rgba(40, 38, 30, 0.18) 56%, rgba(32, 31, 26, 0.72) 100%);
}

.onboarding__brand {
  margin-bottom: 24rpx;
  font-family: "Songti SC", STSong, serif;
  font-size: 72rpx;
  font-weight: $pm-weight-medium;
  letter-spacing: 2rpx;
  line-height: 1.2;
  color: #5b371f;
}

.onboarding__copy {
  position: absolute;
  z-index: 1;
  top: 21%;
  right: $pm-page-inline;
  left: $pm-page-inline;
  display: flex;
  flex-direction: column;
}

.onboarding__footer {
  position: absolute;
  z-index: 1;
  right: $pm-page-inline;
  bottom: 128rpx;
  left: $pm-page-inline;
  display: flex;
  flex-direction: column;
}

.onboarding__intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12rpx;
}

.onboarding__title {
  font-size: 30rpx;
  font-weight: $pm-weight-medium;
  line-height: 1.5;
  color: #80583a;
}

.onboarding__body {
  font-size: 28rpx;
  line-height: 1.5;
  color: #80583a;
}

// ---- actions ----
.onboarding__start {
  margin-top: 44rpx;
  display: flex;
  width: 100%;

  :deep(.primary-button) {
    flex: 1 1 auto;
    width: 100%;
    box-sizing: border-box;
    background-color: rgba(255, 253, 248, 0.94);
    color: $pm-color-ink;
    box-shadow: 0 10rpx 30rpx rgba(48, 40, 26, 0.16);
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
  margin-top: $pm-space-3;
  display: flex;
  justify-content: center;
  align-items: center;

  &-copy {
    font-size: $pm-font-meta;
    line-height: $pm-leading-compact;
    color: rgba(255, 253, 248, 0.74);
  }

  :deep(.text-action),
  :deep(.text-action__label) {
    color: rgba(255, 253, 248, 0.82);
  }
}

.onboarding__privacy-link {
  min-width: auto;
  min-height: auto;
  padding: 0;

  :deep(.text-action__label) {
    font-size: $pm-font-meta;
    text-decoration: underline;
    text-underline-offset: 4rpx;
  }
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
