<template>
  <PageShell
    layout="standard-flow"
    :title="pageTitle"
    :show-back="true"
    @back="goBack"
  >
    <!-- bootstrap loading -->
    <view v-if="!isReady" class="memories__center">
      <text class="memories__muted">{{ loadingLabel }}</text>
    </view>

    <!-- missing param -->
    <MissingContentState
      v-else-if="isMissingParam"
      title="无法找到这个空间"
      description="缺少空间信息，请返回重试。"
      action-label="返回"
      @action="goBack"
    />

    <!-- space not found -->
    <MissingContentState
      v-else-if="space === null"
      description="这个空间已经不存在了。"
      action-label="回到列表"
      @action="goToSpaces"
    />

    <!-- space ready -->
    <template v-else>
      <!-- header: space name + memory count -->
      <view class="memories__header">
        <text class="memories__space-name">{{ space.name }}</text>
        <text class="memories__count">{{ countLabel }}</text>
      </view>

      <!-- empty: no formal memories -->
      <view v-if="memoryEntries.length === 0" class="memories__center">
        <text class="memories__muted">还没有留下记忆</text>
        <view class="memories__action">
          <PrimaryButton width="content" @press="goBack">回到 Ta 的空间</PrimaryButton>
        </view>
      </view>

      <!-- with memories -->
      <template v-else>
        <MemoryList
          :items="memoryEntries"
          @select="goMemoryDetail"
        >
          <template #footer>
            <view class="memories__end-note">
              <text class="memories__muted">先留到这里。以后想起新的，再慢慢回来。</text>
            </view>
          </template>
        </MemoryList>
      </template>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import MemoryList from '../../components/MemoryList.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { parseSpaceRoute } from '../../features/routing/route-params'
import { buildMemoryEntry } from '../../features/memories/memory-summary'
import type { MemoryEntryViewModel } from '../../features/memories/memory-summary'

const appStore = useAppStore()
const memStore = useMemoryStore()
const nav = getNavigation()

const LOADING_DELAY_MS = 150

// ---- route query ----
const spaceId = ref<string | null>(null)
const parseError = ref<{ reason: string; param: string } | null>(null)

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parseSpaceRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
  } else {
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
})

// ---- loading UX ----
const visibleLoading = ref(false)
let delayTimer: ReturnType<typeof setTimeout> | null = null

const isReady = computed(() => appStore.bootstrapStatus === 'ready')

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

// ---- derived state ----
const isMissingParam = computed(() => isReady.value && parseError.value !== null)

const space = computed(() => {
  if (!isReady.value || spaceId.value === null) return null
  return memStore.findSpace(spaceId.value)
})

const allMemories = computed(() => {
  if (!space.value) return []
  return memStore.allMemories(space.value.id)
})

const assets = computed(() => memStore.assets)

const memoryEntries = computed<MemoryEntryViewModel[]>(() =>
  allMemories.value.map(m => buildMemoryEntry(m, assets.value)),
)

// ---- labels ----
const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

const pageTitle = computed(() => '全部记忆')

const countLabel = computed(() => {
  const count = memoryEntries.value.length
  return `${count} 段记忆`
})

// ---- actions ----
function goBack(): void {
  nav.back()
}

function goToSpaces(): void {
  nav.resetTo({ page: 'spaces' })
}

function goMemoryDetail(memoryId: string): void {
  nav.push(`${PAGE_URLS['memory-detail']}?memoryId=${encodeURIComponent(memoryId)}&source=memories`)
}

// ---- test helper ----
function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseSpaceRoute(query)
  if (parsed.kind === 'valid') {
    spaceId.value = parsed.value.spaceId
    parseError.value = null
  } else {
    spaceId.value = null
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
}

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.memories__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
}

.memories__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.memories__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $pm-space-1;
  padding-top: 0;
  padding-bottom: 28rpx;
  margin-bottom: 20rpx;
  border-bottom: $pm-border-hairline solid $pm-color-line;
}

.memories__space-name {
  font-size: 40rpx;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.memories__count {
  font-size: $pm-font-meta;
  color: $pm-color-muted;
}

.memories__action {
  margin-top: $pm-space-6;
}

.memories__end-note {
  display: flex;
  justify-content: center;
  padding-top: 52rpx;

  .memories__muted {
    font-size: 24rpx;
  }
}
</style>
