<!--
  M0 DevPanel 宿主页。
  Task 5 迁移说明：在 Task 5 正式页面落地后，本临时页将被删除。
  DevPanel 将迁移至正式入口（如 '我的' 页面内的开发菜单），
  届时删除本文件并在 pages.json 中移除对应路由。
-->
<template>
  <view class="page">
    <text class="page__title">宠物记忆 M0</text>
    <text v-if="meta.schemaVersion" class="page__meta">
      schema v{{ meta.schemaVersion }} | {{ meta.sampleMode }} | {{ meta.bootstrapStatus }}
    </text>

    <view v-if="showDevPanel" class="page__nav">
      <text class="page__nav-title">页面入口</text>
      <view class="page__nav-row">
        <view class="page__nav-btn" @click="goPage(PAGE_URLS.spaces)">
          <text>02 我的空间</text>
        </view>
        <view class="page__nav-btn" @click="goPage(`${PAGE_URLS['space-home']}?spaceId=s_tuantu`)">
          <text>04 团团首页</text>
        </view>
        <view class="page__nav-btn" @click="goPage(`${PAGE_URLS['space-home']}?spaceId=s_doudou`)">
          <text>04 豆豆首页</text>
        </view>
        <view class="page__nav-btn" @click="goPage(`${PAGE_URLS.memories}?spaceId=s_tuantu`)">
          <text>08 全部记忆</text>
        </view>
      </view>
    </view>

    <DevPanel v-if="showDevPanel" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDevScenarios } from '../../features/developer/dev-scenarios'
import DevPanel from '../../components/DevPanel.vue'
import { PAGE_URLS } from '../../adapters/navigation'
import { getNavigation } from '../../adapters/navigation-deps'

const scenarios = useDevScenarios()
const meta = computed(() => scenarios.getCurrentMeta())

const showDevPanel = import.meta.env.DEV

function goPage(url: string): void {
  getNavigation().push(url)
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
}

</style>
