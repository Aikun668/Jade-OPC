<template>
  <PageShell
    layout="reading"
    :show-back="true"
    @back="handleBack"
  >
    <template #navigation-right>
      <TextAction v-if="isReady && memory !== null" @press="goEdit">
        编辑原话
      </TextAction>
    </template>

    <!-- bootstrap loading -->
    <view v-if="!isReady" class="memory-detail__center">
      <text class="memory-detail__muted">{{ loadingLabel }}</text>
    </view>

    <!-- missing param -->
    <MissingContentState
      v-else-if="isMissingParam"
      title="无法找到这段记忆"
      description="缺少记忆信息，请返回重试。"
      action-label="返回"
      @action="handleBack"
    />

    <!-- memory not found -->
    <MissingContentState
      v-else-if="memory === null"
      title="这段记忆已经不存在了"
      description="它可能已被删除。"
      action-label="返回空间首页"
      @action="handleBack"
    />

    <!-- ready -->
    <template v-else>
      <text class="memory-detail__date">{{ dateLabel }}</text>

      <view v-if="photoItems.length > 0" class="memory-detail__photos">
        <PhotoStack
          :items="photoItems"
          @open="handleOpenViewer"
          @change="handleViewerChange"
        />
      </view>

      <view v-if="memory.entry === 'photo' && !memory.originalText" class="memory-detail__photo-summary">
        <text class="memory-detail__photo-summary-text">一张照片</text>
      </view>

      <view v-if="memory.originalText" class="memory-detail__original">
        <text class="memory-detail__eyebrow">你留下的话</text>
        <text class="memory-detail__text">{{ memory.originalText }}</text>
      </view>

      <view v-if="memory.originalText" class="memory-detail__ai-invitation">
        <text class="memory-detail__ai-hint">如果你愿意，可以把这段原话整理成一个可编辑的候选版本。原话会一直保留。</text>
        <TextAction @press="goAiDraft">
          整理一个候选稿
        </TextAction>
      </view>

      <view v-if="memory.aiCandidateText" class="memory-detail__candidate">
        <view class="memory-detail__candidate-label">
          <text class="memory-detail__eyebrow">候选版本</text>
        </view>
        <text class="memory-detail__text">{{ memory.aiCandidateText }}</text>
      </view>

      <view class="memory-detail__delete">
        <TextAction tone="danger" @press="handleDeletePress">
          删除这段记忆
        </TextAction>
      </view>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="删除这段记忆"
      description="删除后，这段记忆、候选版本和它附带的照片都将不可恢复。"
      confirm-label="删除"
      cancel-label="取消"
      tone="danger"
      :pending="isDeleting"
      :error="deleteError"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />

    <PhotoViewer
      v-if="isReady && memory !== null"
      :open="viewerOpen"
      :items="photoItems"
      :initial-index="viewerIndex"
      @close="viewerOpen = false"
      @change="handleViewerChange"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import PhotoStack from '../../components/PhotoStack.vue'
import PhotoViewer from '../../components/PhotoViewer.vue'
import TextAction from '../../components/TextAction.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { PAGE_URLS } from '../../adapters/navigation'
import { parseMemoryDetailRoute } from '../../features/routing/route-params'
import { formatDateLabel } from '../../features/memories/memory-summary'
import type { MemoryItem } from '../../types/domain'
import type { MemoryDetailSource } from '../../types/routes'
import type { PhotoViewModel } from '../../features/photos/photo-types'

const appStore = useAppStore()
const memStore = useMemoryStore()
const nav = getNavigation()

const LOADING_DELAY_MS = 150
const viewerOpen = ref(false)
const viewerIndex = ref(0)

// ---- route query ----
const memoryId = ref<string | null>(null)
const source = ref<MemoryDetailSource>('space-home')
const parseError = ref<{ reason: string; param: string } | null>(null)

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parseMemoryDetailRoute(query)
  if (parsed.kind === 'valid') {
    memoryId.value = parsed.value.memoryId
    source.value = parsed.value.source
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

const memory = computed<MemoryItem | null>(() => {
  if (!isReady.value || memoryId.value === null) return null
  return memStore.findMemory(memoryId.value) ?? null
})

const dateLabel = computed(() => {
  if (!memory.value) return ''
  return formatDateLabel(memory.value.createdAt)
})

const photoItems = computed<PhotoViewModel[]>(() => {
  const m = memory.value
  if (!m || m.assetIds.length === 0) return []
  return m.assetIds.map((aid) => {
    const a = memStore.findAsset(aid)
    if (a && a.ownerType === 'memory' && a.ownerId === m.id) {
      return {
        id: a.id,
        uri: a.availability === 'available' ? a.uri : '',
        alt: a.availability === 'expired' ? '照片已失效' : '',
        availability: a.availability,
      }
    }
    return { id: aid, uri: '', alt: '照片已失效', availability: 'expired' as const }
  })
})

const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

// ---- actions ----
function handleBack(): void {
  nav.back()
}

function goEdit(): void {
  nav.push(`${PAGE_URLS['memory-edit']}?memoryId=${memoryId.value}`)
}

function goAiDraft(): void {
  nav.push(`${PAGE_URLS['ai-draft']}?memoryId=${memoryId.value}`)
}

function handleOpenViewer(index: number): void {
  viewerIndex.value = index
  viewerOpen.value = true
}

function handleViewerChange(index: number): void {
  viewerIndex.value = index
}

// ---- delete ----
const deleteDialogOpen = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string>()

function handleDeletePress(): void {
  deleteError.value = undefined
  deleteDialogOpen.value = true
}

function handleDeleteCancel(): void {
  deleteDialogOpen.value = false
}

async function handleDeleteConfirm(): Promise<void> {
  if (isDeleting.value || memoryId.value === null) return
  isDeleting.value = true
  deleteError.value = undefined
  try {
    await memStore.deleteMemory(memoryId.value)
    deleteDialogOpen.value = false
    nav.back()
  } catch {
    deleteError.value = '删除失败，请重试'
  } finally {
    isDeleting.value = false
  }
}

// ---- test helper ----
function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseMemoryDetailRoute(query)
  if (parsed.kind === 'valid') {
    memoryId.value = parsed.value.memoryId
    source.value = parsed.value.source
    parseError.value = null
  } else {
    memoryId.value = null
    source.value = 'space-home'
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
}

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.memory-detail__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
}

.memory-detail__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.memory-detail__date {
  display: block;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  margin-bottom: $pm-space-8;
}

.memory-detail__photos {
  margin-bottom: $pm-space-6;
}

.memory-detail__photo-summary {
  margin-bottom: $pm-space-6;
}

.memory-detail__photo-summary-text {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.memory-detail__original {
  padding-bottom: $pm-space-6;
  border-bottom: $pm-border-hairline solid $pm-color-line;
}

.memory-detail__eyebrow {
  display: block;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  margin-bottom: $pm-space-2;
}

.memory-detail__text {
  display: block;
  font-size: $pm-font-body;
  line-height: 1.8;
  color: $pm-color-ink;
  white-space: pre-wrap;
}

.memory-detail__ai-invitation {
  margin-top: $pm-space-6;
  border-radius: $pm-radius-md;
  background: $pm-color-olive-soft;
  padding: $pm-space-5;
}

.memory-detail__ai-hint {
  display: block;
  font-size: $pm-font-body;
  color: $pm-color-muted;
  margin-bottom: $pm-space-3;
}

.memory-detail__candidate {
  margin-top: $pm-space-6;
  padding-left: $pm-space-4;
  border-left: 6rpx solid $pm-color-olive-soft;
}

.memory-detail__candidate-label {
  margin-bottom: $pm-space-2;
}

.memory-detail__delete {
  margin-top: $pm-space-6;
  padding-top: $pm-space-6;
  border-top: $pm-border-hairline solid $pm-color-line;
}
</style>
