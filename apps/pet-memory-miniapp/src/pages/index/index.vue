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

    <!-- 以下开发工具仅在 DEV 模式存在，生产构建时全树被 tree-shake -->
    <view v-if="isDev">

    <!-- 样本切换 -->
    <view class="page__section">
      <text class="page__section-title">样本切换</text>
      <view class="page__row">
        <PrimaryButton
          :disabled="scenarios.isResetting.value"
          :loading="scenarios.isResetting.value"
          @press="scenarios.resetSample('empty')"
        >
          空样本
        </PrimaryButton>
        <PrimaryButton
          :disabled="scenarios.isResetting.value"
          :loading="scenarios.isResetting.value"
          @press="scenarios.resetSample('complete')"
        >
          完整样本
        </PrimaryButton>
      </view>
      <text v-if="scenarios.lastResetError.value" class="page__error">
        {{ scenarios.lastResetError.value }}
      </text>
    </view>

    <!-- AI 场景 Mock -->
    <view class="page__section">
      <text class="page__section-title">AI 场景 Mock</text>
      <view class="page__row">
        <view
          v-for="s in aiScenarios"
          :key="s"
          class="page__chip"
          :class="{ 'page__chip--active': scenarios.aiScenario.value === s }"
          @click.stop="scenarios.setAiScenario(s)"
        >
          <text class="page__chip-text">{{ s }}</text>
        </view>
      </view>
    </view>

    <!-- 失败模拟 -->
    <view class="page__section">
      <text class="page__section-title">失败模拟</text>
      <view class="page__row">
        <view
          class="page__chip"
          :class="{ 'page__chip--danger': scenarios.saveFailureEnabled.value }"
          @click.stop="scenarios.toggleSaveFailure()"
        >
          <text class="page__chip-text">
            保存失败 {{ scenarios.saveFailureEnabled.value ? 'ON' : 'OFF' }}
          </text>
        </view>
        <view
          class="page__chip"
          :class="{ 'page__chip--danger': scenarios.photoFailureEnabled.value }"
          @click.stop="scenarios.togglePhotoFailure()"
        >
          <text class="page__chip-text">
            照片失败 {{ scenarios.photoFailureEnabled.value ? 'ON' : 'OFF' }}
          </text>
        </view>
        <view
          class="page__chip"
          :class="{ 'page__chip--danger': scenarios.permissionDeniedEnabled.value }"
          @click.stop="scenarios.togglePermissionDenied()"
        >
          <text class="page__chip-text">
            权限不足 {{ scenarios.permissionDeniedEnabled.value ? 'ON' : 'OFF' }}
          </text>
        </view>
      </view>
    </view>

    </view>
    <!-- /DEV -->
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { useDevScenarios, type AiScenario } from '../../features/developer/dev-scenarios'

const isDev = import.meta.env.DEV
const scenarios = useDevScenarios()
const meta = computed(() => scenarios.getCurrentMeta())

const aiScenarios: AiScenario[] = ['success', 'insufficient', 'unavailable']
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

.page__section {
  margin-top: $pm-space-8;
}

.page__section-title {
  display: block;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
  color: $pm-color-ink;
  margin-bottom: $pm-space-3;
}

.page__row {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-2;
}

.page__chip {
  padding: $pm-space-2 $pm-space-4;
  border-radius: $pm-radius-sm;
  background-color: $pm-color-surface;
  border: 2rpx solid $pm-color-line;
  cursor: pointer;

  &--active {
    background-color: $pm-color-olive;
    border-color: $pm-color-olive;
    color: $pm-color-on-primary;
  }

  &--danger {
    background-color: $pm-color-danger;
    border-color: $pm-color-danger;
    color: $pm-color-on-primary;
  }
}

.page__chip-text {
  font-size: $pm-font-meta;
  font-weight: $pm-weight-medium;
}

.page__error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-meta;
  color: $pm-color-danger;
}
</style>
