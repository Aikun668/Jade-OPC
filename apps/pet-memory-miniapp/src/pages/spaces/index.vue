<template>
  <PageShell layout="standard-flow" title="我的记忆空间" :show-back="false">
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
    <view v-else>
      <view class="spaces__intro">
        <text class="spaces__desc">在这里查看你为 Ta 留下的所有记忆。</text>
      </view>

      <view class="spaces__list">
        <button
          v-for="s in spaceList"
          :key="s.id"
          class="spaces__card"
          @click.stop="goSpace(s.id)"
        >
          <view class="spaces__card-body">
            <view class="spaces__card-text">
              <text class="spaces__card-name">{{ s.name }}</text>
              <text class="spaces__card-summary">{{ s.hasMemories ? s.latestSummary : '还没有留下记忆' }}</text>
              <text v-if="s.dateLabel" class="spaces__card-date">{{ s.dateLabel }}</text>
            </view>
            <image
              v-if="s.coverUri"
              class="spaces__card-cover"
              :src="s.coverUri"
              mode="aspectFill"
            />
          </view>
        </button>
      </view>

      <view class="spaces__action">
        <PrimaryButton width="content" @press="goCreate">为 Ta 创建一个空间</PrimaryButton>
      </view>
    </view>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
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
  gap: $pm-space-3;
}

.spaces__card {
  width: 100%;
  padding: $pm-space-5;
  border: $pm-border-hairline solid $pm-color-line;
  border-radius: $pm-radius-md;
  background-color: $pm-color-surface;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;

  &:active {
    background-color: $pm-color-olive-soft;
  }
}

.spaces__card-body {
  display: flex;
  align-items: flex-start;
  gap: $pm-space-3;
}

.spaces__card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $pm-space-1;
}

.spaces__card-name {
  font-size: $pm-font-item-title;
  font-weight: $pm-weight-semibold;
  color: $pm-color-ink;
}

.spaces__card-summary {
  font-size: $pm-font-body;
  color: $pm-color-ink;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.spaces__card-date {
  font-size: $pm-font-meta;
  color: $pm-color-muted;
}

.spaces__card-cover {
  flex-shrink: 0;
  width: $pm-photo-memory-thumb;
  height: $pm-photo-memory-thumb;
  border-radius: $pm-photo-radius-thumb;
}
</style>
