<template>
  <PageShell
    layout="standard-flow"
    compact-intro
    title="整理草稿"
    :show-back="true"
    @back="handleBack"
  >
    <template #intro>
      <view class="ai-draft__intro">
        <text class="ai-draft__intro-label">你留下的话</text>
        <text class="ai-draft__intro-text">{{ memory?.originalText ?? '' }}</text>
      </view>
    </template>

    <!-- bootstrap loading -->
    <view v-if="!isReady" class="ai-draft__center">
      <text class="ai-draft__muted">{{ loadingLabel }}</text>
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
      action-label="返回"
      @action="handleBack"
    />

    <!-- authorization-required -->
    <template v-else-if="pageState === 'authorization-required'">
      <view class="ai-draft__consent ai-draft__consent--flow">
        <text class="ai-draft__consent-text">
          将基于这段原话生成一版可编辑的草稿。原话会一直保留。
        </text>
      </view>
    </template>

    <!-- loading -->
    <view v-else-if="pageState === 'loading'" class="ai-draft__center">
      <text v-if="showDraftLoading" class="ai-draft__status-text">正在生成一版草稿…</text>
    </view>

    <!-- insufficient -->
    <view v-else-if="pageState === 'insufficient'" class="ai-draft__center">
      <text class="ai-draft__status-text">这段文字太短，还不足以生成一版草稿。</text>
      <text class="ai-draft__status-sub">你可以回到原话编辑页，写得更多再试试。</text>
    </view>

    <!-- unavailable -->
    <view v-else-if="pageState === 'unavailable'" class="ai-draft__center">
      <text class="ai-draft__status-text">整理服务现在不可用，稍后再试试吧。</text>
    </view>

    <!-- success / save-pending / save-error -->
    <template v-else-if="pageState === 'success' || pageState === 'save-pending' || pageState === 'save-error'">
      <view class="ai-draft__candidate">
        <textarea
          class="ai-draft__textarea"
          :value="candidate"
          :maxlength="-1"
          placeholder="整理后的草稿…"
          @input="onCandidateInput"
        />

        <view v-if="pageState === 'save-error'" class="ai-draft__hint ai-draft__hint--error">
          <text>刚才没有保存成功。这版草稿还在这里，可以再试一次。</text>
        </view>
      </view>
    </template>

    <template #actions v-if="isReady && memory !== null">
      <!-- authorization -->
      <view v-if="pageState === 'authorization-required'" class="ai-draft__actions ai-draft__actions--flow">
        <PrimaryButton @press="handleAuthorize">
          生成一版草稿
        </PrimaryButton>
        <TextAction @press="handleBack">这次先不生成</TextAction>
      </view>

      <!-- success / save-pending / save-error -->
      <view
        v-else-if="pageState === 'success' || pageState === 'save-pending' || pageState === 'save-error'"
        class="ai-draft__actions ai-draft__actions--flow"
      >
        <PrimaryButton
          :disabled="pageState === 'save-pending'"
          @press="handleSave"
        >
          使用这版草稿
        </PrimaryButton>
        <TextAction
          v-if="pageState === 'save-error'"
          @press="handleRetry"
        >
          重新生成
        </TextAction>
      </view>

      <!-- insufficient / unavailable / loading -->
      <view
        v-else-if="pageState === 'insufficient' || pageState === 'unavailable'"
        class="ai-draft__actions ai-draft__actions--flow"
      >
        <PrimaryButton @press="handleRetry">
          重新生成
        </PrimaryButton>
        <TextAction @press="handleBack">返回</TextAction>
      </view>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { getAiDraftService } from '../../services/ai-draft-service-deps'
import { parseMemoryRoute } from '../../features/routing/route-params'
import type { MemoryItem } from '../../types/domain'
import type { AiDraftPageState } from '../../types/ai'

const BOOTSTRAP_LOADING_DELAY_MS = 150
const DRAFT_LOADING_DELAY_MS = 150

const appStore = useAppStore()
const memStore = useMemoryStore()
const nav = getNavigation()

// ---- route ----
const memoryId = ref<string | null>(null)
const parseError = ref<{ reason: string; param: string } | null>(null)

onLoad((options: Record<string, string> | undefined) => {
  const query = options || {}
  const parsed = parseMemoryRoute(query)
  if (parsed.kind === 'valid') {
    memoryId.value = parsed.value.memoryId
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
      }, BOOTSTRAP_LOADING_DELAY_MS)
    } else {
      visibleLoading.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (delayTimer !== null) clearTimeout(delayTimer)
  clearDraftTimer()
})

// ---- derived ----
const isMissingParam = computed(() => isReady.value && parseError.value !== null)

const memory = computed<MemoryItem | null>(() => {
  if (!isReady.value || memoryId.value === null) return null
  return memStore.findMemory(memoryId.value) ?? null
})

const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

// ---- state machine ----
const pageState = ref<AiDraftPageState>('authorization-required')
const candidate = ref('')
const isAuthorizing = ref(false)
const showDraftLoading = ref(false)
let draftDelayTimer: ReturnType<typeof setTimeout> | null = null

// Initialize from the persisted candidate when returning to edit it.
watch(memory, (nextMemory) => {
  const savedCandidate = nextMemory?.aiCandidateText ?? ''
  pageState.value = savedCandidate ? 'success' : 'authorization-required'
  candidate.value = savedCandidate
  isAuthorizing.value = false
})

// ---- actions ----
function clearDraftTimer(): void {
  if (draftDelayTimer !== null) {
    clearTimeout(draftDelayTimer)
    draftDelayTimer = null
  }
}

async function runDraft(): Promise<void> {
  const m = memory.value
  if (!m) return

  pageState.value = 'loading'
  showDraftLoading.value = false
  clearDraftTimer()

  draftDelayTimer = setTimeout(() => {
    draftDelayTimer = null
    showDraftLoading.value = true
  }, DRAFT_LOADING_DELAY_MS)

  try {
    const service = getAiDraftService()
    const result = await service.createDraft({
      memoryId: m.id,
      originalText: m.originalText,
    })

    clearDraftTimer()
    showDraftLoading.value = false

    switch (result.kind) {
      case 'success':
        candidate.value = result.candidate
        pageState.value = 'success'
        break
      case 'insufficient':
        pageState.value = 'insufficient'
        break
      case 'unavailable':
        pageState.value = 'unavailable'
        break
    }
  } catch {
    clearDraftTimer()
    showDraftLoading.value = false
    pageState.value = 'unavailable'
  }
}

async function handleAuthorize(): Promise<void> {
  if (isAuthorizing.value) return
  isAuthorizing.value = true
  try {
    await runDraft()
  } finally {
    isAuthorizing.value = false
  }
}

async function handleRetry(): Promise<void> {
  await runDraft()
}

async function handleSave(): Promise<void> {
  if (pageState.value === 'save-pending') return
  if (memoryId.value === null) return

  pageState.value = 'save-pending'

  try {
    await memStore.updateMemory({
      kind: 'ai-candidate',
      memoryId: memoryId.value,
      aiCandidateText: candidate.value,
    })
    nav.back()
  } catch {
    pageState.value = 'save-error'
  }
}

function handleBack(): void {
  nav.back()
}

function onCandidateInput(e: { detail?: { value?: unknown }; target?: EventTarget | null }): void {
  const detailValue = e.detail?.value
  const target = e.target as HTMLTextAreaElement | null
  const nextValue = typeof detailValue === 'string' ? detailValue : target?.value
  if (typeof nextValue === 'string') candidate.value = nextValue
}

// ---- test helpers ----
function _setQueryForTest(query: Record<string, unknown>): void {
  const parsed = parseMemoryRoute(query)
  if (parsed.kind === 'valid') {
    memoryId.value = parsed.value.memoryId
    parseError.value = null
  } else {
    memoryId.value = null
    parseError.value = { reason: parsed.reason, param: parsed.param }
  }
}

function _overridePageStateForTest(state: string): void {
  pageState.value = state as AiDraftPageState
  if (state === 'success') {
    candidate.value = '那天下午，阳光落在团团柔软的毛上。我们没有做什么，只是安静地坐在窗边，把那一小段温暖留在了彼此身边。'
  }
}

defineExpose({ _setQueryForTest, _overridePageStateForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.ai-draft__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
  gap: $pm-space-3;
}

.ai-draft__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.ai-draft__intro {
  margin-bottom: 0;
}

.ai-draft__intro-label {
  display: block;
  font-size: $pm-font-support;
  color: $pm-color-muted;
  margin-bottom: $pm-space-2;
}

.ai-draft__intro-text {
  font-size: $pm-font-body;
  color: $pm-color-ink;
  line-height: 1.6;
}

.ai-draft__consent {
  padding: $pm-space-4;
  border-radius: $pm-radius-md;
  background: $pm-color-olive-soft;
}

.ai-draft__consent--flow,
.ai-draft__candidate {
  width: 100%;
  box-sizing: border-box;
}

.ai-draft__consent-text {
  font-size: $pm-font-body;
  color: $pm-color-muted;
  line-height: 1.8;
}

.ai-draft__status-text {
  font-size: $pm-font-body;
  color: $pm-color-ink;
  text-align: center;
  line-height: 1.8;
}

.ai-draft__status-sub {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  text-align: center;
}

.ai-draft__textarea {
  width: 100%;
  min-height: 320rpx;
  padding: $pm-space-5;
  border: none;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
  font-size: $pm-font-body;
  line-height: 1.8;
  color: $pm-color-ink;
  box-sizing: border-box;
}

.ai-draft__hint {
  margin-top: $pm-space-3;
  font-size: $pm-font-support;
  line-height: 1.5;
}

.ai-draft__hint--error {
  color: $pm-color-ink;
  background: rgba($pm-color-surface, 0.6);
  padding: $pm-space-3 $pm-space-4;
  border-radius: $pm-radius-sm;
}

.ai-draft__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: $pm-space-3;

  :deep(.primary-button) {
    width: 100%;
  }

  // The custom component host must also stretch; otherwise the inner
  // button's 100% width resolves against a content-sized host.
  :deep(primary-button) {
    display: block;
    width: 100%;
  }
}

:deep(.page-shell__actions--standard-flow) {
  margin-top: $pm-space-5;
}
</style>
