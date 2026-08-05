<template>
  <PageShell layout="standard-flow" :show-back="true" @back="goBack">
    <MissingContentState
      v-if="parseError"
      title="无法打开记录入口"
      description="空间信息不正确，请返回重试。"
      action-label="返回"
      @action="goBack"
    />

    <template v-if="!parseError" #intro>
      <view class="record-entry__intro">
        <text class="record-entry__title">今天想从哪里开始？</text>
        <text class="record-entry__desc">不用全部完成。选一个此刻比较容易靠近的方向就好。</text>
      </view>
    </template>

    <view v-if="!parseError" class="record-entry__list">
      <button
        v-for="entry in textEntries"
        :key="entry.key"
        class="record-entry__item"
        @click="goText(entry.key)"
      >
        <view class="record-entry__item-text">
          <text class="record-entry__item-title">{{ entry.title }}</text>
          <text class="record-entry__item-body">{{ entry.body }}</text>
        </view>
        <text class="record-entry__item-arrow">›</text>
      </button>
      <button class="record-entry__item record-entry__item--photo" @click="goPhoto">
        <view class="record-entry__item-text">
          <text class="record-entry__item-title">一张照片</text>
          <text class="record-entry__item-body">从拍过或存下的一张照片里记起</text>
        </view>
        <text class="record-entry__item-arrow">›</text>
      </button>
    </view>

    <template v-if="!parseError" #actions>
      <view class="record-entry__skip">
        <TextAction @press="goBack">这次先看看</TextAction>
      </view>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import TextAction from '../../components/TextAction.vue'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { parseRecordEntryRoute } from '../../features/routing/route-params'
import type { TextEntry } from '../../features/recording/entry-prompts'

const nav = getNavigation()
const spaceId = ref('')
const parseError = ref<{ reason: string; param: string } | null>(null)

const textEntries: Array<{ key: TextEntry; title: string; body: string }> = [
  { key: 'daily', title: '日常', body: '从一个熟悉的小习惯开始' },
  { key: 'meeting', title: '相遇', body: '想想你们第一次见面的样子' },
  { key: 'relationship', title: '你们的关系', body: '用一句话，说说 Ta 对你的意义' },
]

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parseRecordEntryRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
  } else {
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
})

function goText(entry: TextEntry): void {
  nav.push(`${PAGE_URLS['record-text']}?spaceId=${encodeURIComponent(spaceId.value)}&entry=${encodeURIComponent(entry)}`)
}

function goPhoto(): void {
  nav.push(`${PAGE_URLS['record-photo']}?spaceId=${encodeURIComponent(spaceId.value)}`)
}

function goBack(): void {
  nav.back()
}

// ---- test helper ----
function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseRecordEntryRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
    parseError.value = null
  } else {
    spaceId.value = ''
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
}

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.record-entry__intro {
  display: flex;
  flex-direction: column;
  gap: $pm-space-2;
  text-align: center;
}

.record-entry__title {
  font-size: $pm-font-page-title;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.record-entry__desc {
  font-size: $pm-font-body;
  line-height: $pm-leading-body;
  color: $pm-color-muted;
}

.record-entry__list {
  border-top: $pm-border-hairline solid $pm-color-line;
  margin-top: $pm-space-8;
}

.record-entry__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 168rpx;
  padding-block: 32rpx;
  padding-inline: 8rpx;
  border: none;
  border-bottom: $pm-border-hairline solid $pm-color-line;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  border-radius: 0;

  &::after {
    border: none;
  }

  &:active {
    background-color: $pm-color-olive-soft;
  }
}

.record-entry__item-text {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.record-entry__item-title {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-medium;
  line-height: $pm-leading-compact;
  color: $pm-color-ink;
}

.record-entry__item-body {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.record-entry__item-arrow {
  flex-shrink: 0;
  font-size: 44rpx;
  color: $pm-color-muted;
  line-height: 1;
}

.record-entry__skip {
  display: flex;
  justify-content: center;
  margin-top: 56rpx;
}
</style>
