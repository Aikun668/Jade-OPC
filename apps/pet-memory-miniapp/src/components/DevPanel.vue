<!--
  DevPanel — M0 development-only scenario switcher.
  All dev UI text lives here so pages/index/index.vue template does not
  carry Chinese dev strings into production WXML artifacts.
-->
<template>
  <view v-if="isDev" class="dev-panel">
    <view class="dev-panel__toggle" @click.stop="expanded = !expanded">
      <text class="dev-panel__toggle-text">DEV</text>
    </view>

    <view v-if="expanded" class="dev-panel__body">
      <!-- 样本切换 -->
      <view class="dev-panel__section">
        <text class="dev-panel__section-title">样本切换</text>
        <view class="dev-panel__row">
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
        <text v-if="scenarios.lastResetError.value" class="dev-panel__error">
          {{ scenarios.lastResetError.value }}
        </text>
      </view>

      <!-- AI 场景 Mock -->
      <view class="dev-panel__section">
        <text class="dev-panel__section-title">AI 场景 Mock</text>
        <view class="dev-panel__row">
          <view
            v-for="s in aiScenarios"
            :key="s"
            class="dev-panel__chip"
            :class="{ 'dev-panel__chip--active': scenarios.aiScenario.value === s }"
            @click.stop="scenarios.setAiScenario(s)"
          >
            <text class="dev-panel__chip-text">{{ s }}</text>
          </view>
        </view>
      </view>

      <!-- 失败模拟 -->
      <view class="dev-panel__section">
        <text class="dev-panel__section-title">失败模拟</text>
        <view class="dev-panel__row">
          <view
            class="dev-panel__chip"
            :class="{ 'dev-panel__chip--danger': scenarios.saveFailureEnabled.value }"
            @click.stop="scenarios.toggleSaveFailure()"
          >
            <text class="dev-panel__chip-text">
              保存失败 {{ scenarios.saveFailureEnabled.value ? 'ON' : 'OFF' }}
            </text>
          </view>
          <view
            class="dev-panel__chip"
            :class="{ 'dev-panel__chip--danger': scenarios.photoFailureEnabled.value }"
            @click.stop="scenarios.togglePhotoFailure()"
          >
            <text class="dev-panel__chip-text">
              照片失败 {{ scenarios.photoFailureEnabled.value ? 'ON' : 'OFF' }}
            </text>
          </view>
          <view
            class="dev-panel__chip"
            :class="{ 'dev-panel__chip--danger': scenarios.permissionDeniedEnabled.value }"
            @click.stop="scenarios.togglePermissionDenied()"
          >
            <text class="dev-panel__chip-text">
              权限不足 {{ scenarios.permissionDeniedEnabled.value ? 'ON' : 'OFF' }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PrimaryButton from './PrimaryButton.vue'
import { useDevScenarios, type AiScenario } from '../features/developer/dev-scenarios'

const isDev = import.meta.env.DEV
const expanded = ref(false)
const scenarios = useDevScenarios()
const aiScenarios: AiScenario[] = ['success', 'insufficient', 'unavailable']
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.dev-panel {
  position: fixed;
  right: $pm-space-3;
  bottom: calc(var(--pm-safe-bottom, 0px) + #{$pm-space-16});
  z-index: $pm-z-header;
}

.dev-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: $pm-radius-round;
  background: $pm-color-overlay;
}

.dev-panel__toggle-text {
  font-size: $pm-font-meta;
  font-weight: $pm-weight-semibold;
  color: $pm-color-on-primary;
}

.dev-panel__body {
  position: absolute;
  right: 0;
  bottom: calc(100% + #{$pm-space-2});
  width: 320rpx;
  padding: $pm-space-4;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
  box-shadow: $pm-shadow-paper;
  display: flex;
  flex-direction: column;
  gap: $pm-space-4;
}

.dev-panel__section-title {
  display: block;
  font-size: $pm-font-meta;
  font-weight: $pm-weight-medium;
  color: $pm-color-muted;
  margin-bottom: $pm-space-2;
}

.dev-panel__row {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-2;
}

.dev-panel__chip {
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

.dev-panel__chip-text {
  font-size: $pm-font-meta;
  font-weight: $pm-weight-medium;
}

.dev-panel__error {
  display: block;
  margin-top: $pm-space-2;
  font-size: $pm-font-meta;
  color: $pm-color-danger;
}
</style>
