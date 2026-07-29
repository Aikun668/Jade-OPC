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

    <DevPanel />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DevPanel from '../../components/DevPanel.vue'
import { useDevScenarios } from '../../features/developer/dev-scenarios'

const scenarios = useDevScenarios()
const meta = computed(() => scenarios.getCurrentMeta())
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

</style>
