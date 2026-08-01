<template>
  <PageShell
    layout="standard-flow"
    :title="pageTitle"
    :show-back="true"
    @back="goBack"
  >
    <template #navigation-right>
      <TextAction tone="muted" @press="goSettings">更多</TextAction>
    </template>
    <!-- bootstrap loading -->
    <view v-if="!isReady" class="space-home__center">
      <text class="space-home__muted">{{ loadingLabel }}</text>
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

    <!-- ready: space exists -->
    <template v-else>
      <!-- identity: space name + cover -->
      <view class="space-home__identity">
        <image
          v-if="coverUri"
          class="space-home__cover"
          :src="coverUri"
          mode="aspectFill"
        />
        <view class="space-home__identity-text">
          <text class="space-home__name">{{ space.name }}</text>
        </view>
      </view>

      <!-- draft notice -->
      <view v-if="draft" class="space-home__draft">
        <DraftNotice
          :title="draftTitle"
          @continue="continueDraft"
        />
      </view>

      <!-- primary action: leave a memory -->
      <view class="space-home__primary-action">
        <PrimaryButton width="content" @press="goRecord">
          {{ primaryActionLabel }}
        </PrimaryButton>
      </view>

      <!-- recent memories -->
      <view v-if="memoryEntries.length > 0" class="space-home__recent">
        <view class="space-home__divider" />
        <view class="space-home__recent-header">
          <text class="space-home__section-title">最近留下</text>
        </view>
        <MemoryList
          :items="memoryEntries"
          @select="goMemoryDetail"
        />
        <view class="space-home__view-all">
          <TextAction @press="goAllMemories">查看全部记忆</TextAction>
        </view>
      </view>

    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import DraftNotice from '../../components/DraftNotice.vue'
import MemoryList from '../../components/MemoryList.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { parseSpaceRoute } from '../../features/routing/route-params'
import { buildMemoryEntry } from '../../features/memories/memory-summary'
import { NEUTRAL_PHOTO_SUMMARY } from '../../features/memories/memory-constants'
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

const memories = computed(() => {
  if (!space.value) return []
  return memStore.recentMemories(space.value.id)
})

const draft = computed(() => {
  if (!space.value) return null
  return memStore.draftForSpace(space.value.id)
})

const assets = computed(() => memStore.assets)

const coverUri = computed(() => {
  if (!space.value || !space.value.coverAssetId) return undefined
  const asset = memStore.findAsset(space.value.coverAssetId)
  if (!asset || asset.ownerType !== 'space' || asset.ownerId !== space.value.id) return undefined
  if (asset.availability !== 'available') return undefined
  return asset.uri
})

const memoryEntries = computed<MemoryEntryViewModel[]>(() =>
  memories.value.map(m => buildMemoryEntry(m, assets.value)),
)

// ---- labels ----
const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

const pageTitle = computed(() => {
  if (space.value) return space.value.name
  return ''
})

const draftTitle = computed(() => {
  if (!draft.value) return ''
  return draft.value.text || NEUTRAL_PHOTO_SUMMARY
})

const primaryActionLabel = computed(() => {
  return draft.value ? '留下一段新的记忆' : '留下一段'
})

// ---- actions ----
function goBack(): void {
  nav.back()
}

function goToSpaces(): void {
  nav.resetTo({ page: 'spaces' })
}

function goRecord(): void {
  if (!spaceId.value) return
  nav.push(`${PAGE_URLS['record-entry']}?spaceId=${encodeURIComponent(spaceId.value)}`)
}

function continueDraft(): void {
  // Navigate to record-entry — Task 5B+ page, contract only
  if (!space.value) return
  nav.push(`${PAGE_URLS['record-entry']}?spaceId=${encodeURIComponent(space.value.id)}`)
}

function goMemoryDetail(memoryId: string): void {
  nav.push(`${PAGE_URLS['memory-detail']}?memoryId=${encodeURIComponent(memoryId)}&source=space-home`)
}

function goAllMemories(): void {
  if (!spaceId.value) return
  nav.push(`${PAGE_URLS.memories}?spaceId=${encodeURIComponent(spaceId.value)}`)
}

function goSettings(): void {
  if (!spaceId.value) return
  nav.push(`${PAGE_URLS['space-settings']}?spaceId=${encodeURIComponent(spaceId.value)}`)
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

.space-home__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
}

.space-home__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.space-home__identity {
  display: flex;
  align-items: center;
  gap: 36rpx;
  padding-top: 26rpx;
  margin-bottom: 72rpx;
}

.space-home__cover {
  flex-shrink: 0;
  width: 184rpx;
  height: 184rpx;
  border-radius: $pm-photo-radius-large;
}

.space-home__identity-text {
  display: flex;
  flex-direction: column;
  gap: $pm-space-1;
}

.space-home__name {
  font-size: 52rpx;
  font-weight: $pm-weight-semibold;
  line-height: $pm-leading-title;
  color: $pm-color-ink;
}

.space-home__draft {
  margin-top: 0;
}

.space-home__primary-action {
  display: flex;
  justify-content: center;
  margin-top: 48rpx;
  margin-bottom: 64rpx;

  :deep(.primary-button) {
    width: 56%;
  }
}

.space-home__recent {
  margin-top: 0;
}

.space-home__recent-header {
  padding: 56rpx 0 24rpx;
}

.space-home__section-title {
  font-size: $pm-font-section-title;
  font-weight: $pm-weight-medium;
  line-height: $pm-leading-compact;
  color: $pm-color-ink;
}

.space-home__divider {
  height: $pm-border-hairline;
  background-color: $pm-color-line;
}

.space-home__view-all {
  display: flex;
  justify-content: center;
  padding-block: 28rpx;
}
</style>
