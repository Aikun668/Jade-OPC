<template>
  <view class="page">
    <text class="title">宠物记忆</text>
    <text class="hint">M0 工程骨架 — 模板页面</text>
  </view>
</template>

<script setup lang="ts">
// Page components are loaded on demand by uni-app routing.
// Build-time component inclusion is verified via build:verify-components script.
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: $pm-color-canvas;
}

.title {
  font-size: 48rpx;
  font-weight: 600;
  color: $pm-color-ink;
}

.hint {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: $pm-color-muted;
}
</style>
