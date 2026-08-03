<template>
  <PageShell layout="reading" title="隐私说明" show-back @back="goBack">
    <template #intro>
      <view class="privacy__intro">
        <text class="privacy__intro-title">你的记忆，默认只属于你</text>
        <text class="privacy__intro-body">这份说明描述 M0 本地 Mock 阶段实际具备的能力，不提前承诺云端功能。</text>
      </view>
    </template>

    <view class="privacy__sections">
      <view class="privacy__section">
        <text class="privacy__section-title">文字保存在本地</text>
        <text class="privacy__section-body">M0 使用本机的本地 Mock 数据验证记录与回看流程。M1 才会接入 CloudBase，实现数据的私密保存与真实能力。</text>
      </view>
      <view class="privacy__section">
        <text class="privacy__section-title">照片只用于会话预览</text>
        <text class="privacy__section-body">你选择的照片不会被描述为已经永久保存。重新启动后照片可能不可用，文字仍会保留。</text>
      </view>
      <view class="privacy__section">
        <text class="privacy__section-title">AI 只提供候选稿</text>
        <text class="privacy__section-body">M0 使用固定 Mock 场景，不调用真实模型。未来接入真实 AI 时，也需要按次说明并取得你的同意。</text>
      </view>
      <view class="privacy__section">
        <text class="privacy__section-title">删除不可恢复</text>
        <text class="privacy__section-body">删除记忆或空间前会明确说明范围。M0 不提供虚假的导出入口，导出会随 M1 的数据能力一起实现。</text>
      </view>
    </view>

    <template #actions>
      <view class="privacy__confirm">
        <PrimaryButton @press="goBack">我知道了</PrimaryButton>
      </view>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { getNavigation } from '../../adapters/navigation-deps'

const VALID_SOURCES = ['onboarding', 'settings'] as const

const nav = getNavigation()

onLoad((options: Record<string, string> | undefined) => {
  const rawSource = options?.source ?? ''
  if (rawSource && !VALID_SOURCES.includes(rawSource as typeof VALID_SOURCES[number])) {
    // Illegal source — silently ignore, page renders with back navigation intact
  }
})

function goBack(): void {
  nav.back()
}

// ---- test-only ----

function _setQueryForTest(_query: Record<string, unknown>): void {
  // Page reads source from onLoad options; in tests source is validated at mount time.
  // The page renders identically regardless of source value — source only affects
  // onLoad validation (no-op for tests).
}

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.privacy__intro {
  display: flex;
  flex-direction: column;
  gap: $pm-space-4;
}

.privacy__intro-title {
  font-size: $pm-font-page-title;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.privacy__intro-body {
  font-size: $pm-font-body;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

.privacy__sections {
  border-top: $pm-border-hairline solid $pm-color-line;
}

.privacy__section {
  padding-block: 42rpx;
  border-bottom: $pm-border-hairline solid $pm-color-line;
}

.privacy__section-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-medium;
  line-height: $pm-leading-compact;
  color: $pm-color-ink;
}

.privacy__section-body {
  display: block;
  font-size: $pm-font-support;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

.privacy__confirm {
  margin-top: $pm-section-gap;
}
</style>
