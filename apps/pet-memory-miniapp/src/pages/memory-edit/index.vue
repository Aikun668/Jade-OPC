<template>
  <PageShell
    layout="standard-flow"
    compact-intro
    title="编辑原话"
    :show-back="true"
    @back="handleBack"
  >
    <template #intro>
      <view class="memory-edit__note">
        <text class="memory-edit__note-text">
          这里只修改你留下的话。已经确认的候选稿不会自动覆盖或重新生成。
        </text>
      </view>
    </template>

    <!-- bootstrap loading -->
    <view v-if="!isReady" class="memory-edit__center">
      <text class="memory-edit__muted">{{ loadingLabel }}</text>
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
      action-label="返回详情"
      @action="handleBack"
    />

    <template v-else>
      <textarea
        class="memory-edit__textarea"
        :value="text"
        :maxlength="-1"
        placeholder="你留下的话…"
        @input="onInput"
      />

      <view v-if="isOverLimit" class="memory-edit__hint memory-edit__hint--warn">
        <text>已超过 2000 字，可以试着精简一下再保存。</text>
      </view>

      <view v-if="saveError" class="memory-edit__hint memory-edit__hint--error">
        <text>刚才没有保存成功。你的修改还在这里，可以再试一次。</text>
      </view>
    </template>

    <template #actions>
      <view class="memory-edit__actions">
        <template v-if="isReady && memory !== null">
          <view class="memory-edit__save">
            <PrimaryButton
              width="block"
              :disabled="isSaving || isOverLimit"
              @press="handleSave"
            >
              保存修改
            </PrimaryButton>
          </view>
          <TextAction
            :disabled="isSaving"
            @press="handleCancel"
          >
            这次先不改
          </TextAction>
        </template>
      </view>
    </template>

    <ConfirmDialog
      :open="showReturnDialog"
      title="修改还没保存"
      description="现在离开，刚才的修改不会保留。"
      confirm-label="先不保存"
      cancel-label="继续修改"
      @confirm="handleReturnDiscard"
      @cancel="showReturnDialog = false"
      @discard="handleReturnDiscard"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '../../components/PageShell.vue'
import MissingContentState from '../../components/MissingContentState.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import TextAction from '../../components/TextAction.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useAppStore } from '../../stores/app'
import { useMemoryStore } from '../../stores/memory'
import { getNavigation } from '../../adapters/navigation-deps'
import { parseMemoryRoute } from '../../features/routing/route-params'
import type { MemoryItem } from '../../types/domain'

const MAX_LENGTH = 2000
const LOADING_DELAY_MS = 150

const appStore = useAppStore()
const memStore = useMemoryStore()
const nav = getNavigation()

// ---- route query ----
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

const loadingLabel = computed(() => visibleLoading.value ? '正在准备…' : '')

// ---- editor state ----
const text = ref('')
const initialText = ref('')
const isSaving = ref(false)
const saveError = ref(false)
const showReturnDialog = ref(false)

const isDirty = computed(() => text.value !== initialText.value)
const isOverLimit = computed(() => text.value.length > MAX_LENGTH)

// Initialize text from memory
watch(memory, (m) => {
  if (m) {
    text.value = m.originalText
    initialText.value = m.originalText
    saveError.value = false
  }
})

// ---- actions ----
function onInput(e: { detail?: { value?: unknown }; target?: EventTarget | null }): void {
  const detailValue = e.detail?.value
  const target = e.target as HTMLTextAreaElement | null
  const nextValue = typeof detailValue === 'string' ? detailValue : target?.value
  if (typeof nextValue === 'string') text.value = nextValue
  if (saveError.value) saveError.value = false
}

function handleBack(): void {
  if (isDirty.value) {
    showReturnDialog.value = true
    return
  }
  nav.back()
}

function handleReturnDiscard(): void {
  showReturnDialog.value = false
  nav.back()
}

function handleCancel(): void {
  if (isDirty.value) {
    showReturnDialog.value = true
    return
  }
  nav.back()
}

async function handleSave(): Promise<void> {
  if (isOverLimit.value) return
  if (isSaving.value) return
  if (memoryId.value === null) return

  isSaving.value = true
  saveError.value = false

  try {
    await memStore.updateMemory({
      kind: 'original-text',
      memoryId: memoryId.value,
      originalText: text.value,
    })
    initialText.value = text.value
    nav.back()
  } catch {
    saveError.value = true
  } finally {
    isSaving.value = false
  }
}

// ---- test helper ----
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

defineExpose({ _setQueryForTest })
</script>

<style lang="scss" scoped>
@import '../../styles/tokens.scss';

.memory-edit__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: $pm-empty-min-height;
  padding-block: $pm-space-12;
}

.memory-edit__muted {
  font-size: $pm-font-body;
  color: $pm-color-muted;
}

.memory-edit__note {
  margin-bottom: 0;
}

.memory-edit__note-text {
  font-size: $pm-font-support;
  color: $pm-color-muted;
  line-height: 1.6;
}

.memory-edit__textarea {
  width: 100%;
  min-height: 520rpx;
  padding: $pm-space-5;
  border: none;
  border-radius: $pm-radius-md;
  background: $pm-color-surface;
  font-size: $pm-font-body;
  line-height: 1.8;
  color: $pm-color-ink;
  box-sizing: border-box;
}

.memory-edit__hint {
  margin-top: $pm-space-3;
  font-size: $pm-font-support;
  line-height: 1.5;
}

.memory-edit__hint--warn {
  color: $pm-color-muted;
}

.memory-edit__hint--error {
  color: $pm-color-ink;
  background: rgba($pm-color-surface, 0.6);
  padding: $pm-space-3 $pm-space-4;
  border-radius: $pm-radius-sm;
}

.memory-edit__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: calc(#{$pm-control-height-primary} + #{$pm-space-3} + #{$pm-control-height-regular});
  gap: $pm-space-3;
}

.memory-edit__save {
  display: flex;
  width: 100%;

  :deep(.primary-button) {
    // Preserve PrimaryButton's flex centering; block here makes the label
    // sit against the top of the native WeChat button.
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    box-sizing: border-box;
  }

  // Keep the component selector explicit for mp-weixin's scoped style output.
  :deep(primary-button) {
    display: block;
    width: 100%;
  }
}
</style>
