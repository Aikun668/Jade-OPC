<template>
  <PageShell layout="standard-flow" title="我的记忆空间" :show-back="false">
    <template #navigation-right>
      <TextAction tone="muted" @press="goCreate">+</TextAction>
    </template>

    <!-- loading -->
    <view v-if="isLoading" class="spaces__center">
      <text class="spaces__muted">{{ loadingLabel }}</text>
    </view>

    <!-- error -->
    <view v-else-if="isError" class="spaces__center">
      <text class="spaces__muted">暂时没有打开这里。</text>
      <view class="spaces__action">
        <PrimaryButton width="content" @press="retry">再试一次</PrimaryButton>
      </view>
    </view>

    <!-- empty -->
    <view v-else-if="spaceList.length === 0" class="spaces__center">
      <text class="spaces__muted">还没有记忆空间</text>
      <view class="spaces__action">
        <PrimaryButton width="content" @press="goCreate">为 Ta 创建一个空间</PrimaryButton>
      </view>
    </view>

    <!-- with spaces -->
    <template v-else>
      <view class="spaces__intro">
        <text class="spaces__desc">每一个 Ta，都有自己的位置。</text>
      </view>

      <view class="spaces__list">
        <button
          v-for="(s, idx) in spaceList"
          :key="s.id"
          class="spaces__item"
          @click.stop="goSpace(s.id)"
        >
          <image
            v-if="s.coverUri"
            class="spaces__item-thumb"
            :src="s.coverUri"
            mode="aspectFill"
          />
          <view v-else class="spaces__item-placeholder" />
          <view class="spaces__item-text">
            <text class="spaces__item-name">{{ s.name }}</text>
            <text class="spaces__item-summary">{{ s.hasMemories ? s.latestSummary : '还没有留下记忆' }}</text>
            <text v-if="s.dateLabel" class="spaces__item-date">{{ s.dateLabel }}</text>
          </view>
          <text class="spaces__item-arrow">›</text>
          <view v-if="idx < spaceList.length - 1" class="spaces__divider" />
        </button>
      </view>

      <view class="spaces__create-hint">
        <TextAction @press="goCreate">+ 再为一位 Ta 创建空间</TextAction>
      </view>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { buildSpaceSummary } from '../../features/memories/memory-summary'
import type { MemorySpace } from '../../types/domain'

const LOADING_DELAY_MS = 150

const appStore = useAppStore()
const memStore = useMemoryStore()

const visibleLoading = ref(false)
let delayTimer: ReturnType<typeof setTimeout> | null = null

const bootstrapStatus = computed(() => appStore.bootstrapStatus)
const isLoading = computed(() => {
  return bootstrapStatus.value === 'idle' || bootstrapStatus.value === 'loading'
})
const isError = computed(() => bootstrapStatus.value === 'error')

const spaceList = computed(() =>
  memStore.sortedSpaces.map((s: MemorySpace) =>
    buildSpaceSummary(s, memStore.memories, memStore.assets),
  ),
)

const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

watch(
  () => appStore.bootstrapStatus,
  (status) => {
    if (delayTimer !== null) { clearTimeout(delayTimer); delayTimer = null }
    if (status === 'loading' || status === 'idle') {
      delayTimer = setTimeout(() => {
        delayTimer = null
        visibleLoading.value = true
      }, LOADING_DELAY_MS)
    } else {
      visibleLoading.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (delayTimer !== null) clearTimeout(delayTimer)
})

function retry(): void {
  appStore.bootstrap()
}

function goCreate(): void {
  getNavigation().push(PAGE_URLS['space-create'])
}

function goSpace(spaceId: string): void {
  getNavigation().push(`${PAGE_URLS['space-home']}?spaceId=${encodeURIComponent(spaceId)}`)
}
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.spaces__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
  gap: $pm-space-2;
}

.spaces__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
  text-align: center;
}

.spaces__action {
  margin-top: $pm-space-6;
}

.spaces__intro {
  margin-bottom: $pm-section-gap;
}

.spaces__desc {
  font-size: $pm-font-support;
  color: $pm-color-muted;
}

.spaces__list {
  display: flex;
  flex-direction: column;
}

.spaces__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: $pm-space-3;
  width: 100%;
  padding-block: $pm-space-4;
  padding-inline: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  border-radius: 0;

  &:active {
    background-color: $pm-color-olive-soft;
  }
}

.spaces__item-thumb {
  flex-shrink: 0;
  width: $pm-photo-space-list;
  height: $pm-photo-space-list;
  border-radius: $pm-photo-radius-thumb;
}

.spaces__item-placeholder {
  flex-shrink: 0;
  width: $pm-photo-space-list;
  height: $pm-photo-space-list;
  border-radius: $pm-photo-radius-thumb;
  background-color: $pm-color-olive-soft;
}

.spaces__item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $pm-space-1;
}

.spaces__item-name {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
}

.spaces__item-summary {
  font-size: $pm-font-body;
  color: $pm-color-ink;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.spaces__item-date {
  font-size: $pm-font-meta;
  color: $pm-color-muted;
}

.spaces__item-arrow {
  flex-shrink: 0;
  font-size: $pm-font-section-title;
  color: $pm-color-line;
  line-height: 1;
}

.spaces__divider {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: $pm-border-hairline;
  background-color: $pm-color-line;
}

.spaces__create-hint {
  display: flex;
  justify-content: center;
  margin-top: $pm-section-gap;
}
</style>
