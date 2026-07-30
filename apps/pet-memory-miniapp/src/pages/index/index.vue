<!--
  M0 DevPanel 宿主页。
  Task 5 迁移说明：在 Task 5 正式页面落地后，本临时页将被删除。
  DevPanel 将迁移至正式入口（如 '我的' 页面内的开发菜单），
  届时删除本文件并在 pages.json 中移除对应路由。
-->
<template>
  <view class="page">
    <text class="page__title">宠物记忆 M0</text>
    <text class="page__meta">
      schema v{{ meta.schemaVersion }} | {{ meta.sampleMode }} | {{ meta.bootstrapStatus }}
      <text v-if="meta.bootstrapStatus === 'error' && appStore.initError" class="page__meta-error">
        — {{ appStore.initError }}
      </text>
    </text>

    <view v-if="showDevPanel" class="page__nav">
      <text class="page__nav-title">页面入口（先准备 complete 样本再跳转）</text>
      <view class="page__nav-row">
        <view
          class="page__nav-btn"
          :class="{ 'page__nav-btn--disabled': isPreparing }"
          @click="openCompleteScenario(PAGE_URLS.spaces)"
        >
          <text>02 我的空间</text>
        </view>
        <view
          class="page__nav-btn"
          :class="{ 'page__nav-btn--disabled': isPreparing }"
          @click="openCompleteScenario(`${PAGE_URLS['space-home']}?spaceId=s_tuantu`)"
        >
          <text>04 团团首页</text>
        </view>
        <view
          class="page__nav-btn"
          :class="{ 'page__nav-btn--disabled': isPreparing }"
          @click="openCompleteScenario(`${PAGE_URLS['space-home']}?spaceId=s_doudou`)"
        >
          <text>04 豆豆首页</text>
        </view>
        <view
          class="page__nav-btn"
          :class="{ 'page__nav-btn--disabled': isPreparing }"
          @click="openCompleteScenario(`${PAGE_URLS.memories}?spaceId=s_tuantu`)"
        >
          <text>08 全部记忆</text>
        </view>
      </view>
      <text v-if="isPreparing" class="page__nav-status">正在准备样本…</text>
      <text v-if="prepareError" class="page__nav-error">{{ prepareError }}</text>
    </view>

    <DevPanel v-if="showDevPanel" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDevScenarios } from '../../features/developer/dev-scenarios'
import { useAppStore } from '../../stores/app'
import DevPanel from '../../components/DevPanel.vue'
import { PAGE_URLS } from '../../adapters/navigation'
import { getNavigation } from '../../adapters/navigation-deps'

const scenarios = useDevScenarios()
const appStore = useAppStore()
const meta = computed(() => scenarios.getCurrentMeta())
const isPreparing = ref(false)
const prepareError = ref<string | null>(null)

const showDevPanel = import.meta.env.DEV

async function openCompleteScenario(url: string): Promise<void> {
  if (isPreparing.value) return
  isPreparing.value = true
  prepareError.value = null

  try {
    await scenarios.resetSample('complete')
    await getNavigation().push(url)
  } catch (e: unknown) {
    prepareError.value = e instanceof Error ? e.message : '准备样本失败'
  } finally {
    isPreparing.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.page {
  padding: $pm-space-6;
  min-height: 100vh;
  background-color: $pm-color-canvas;
}

.page__title {
  font-size: 40rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
}

.page__meta {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-meta;
  color: $pm-color-muted;
}

.page__nav {
  margin-top: $pm-space-8;
}

.page__nav-title {
  display: block;
  font-size: $pm-font-meta;
  font-weight: $pm-weight-medium;
  color: $pm-color-muted;
  margin-bottom: $pm-space-2;
}

.page__nav-row {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-2;
}

.page__nav-btn {
  padding: $pm-space-2 $pm-space-4;
  border-radius: $pm-radius-sm;
  border: 2rpx solid $pm-color-line;
  background: $pm-color-surface;
  cursor: pointer;

  &:active {
    background: $pm-color-olive-soft;
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.page__nav-status {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-meta;
  color: $pm-color-olive;
}

.page__nav-error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-meta;
  color: $pm-color-danger;
}

.page__meta-error {
  color: $pm-color-danger;
  font-weight: $pm-weight-medium;
}

</style>
