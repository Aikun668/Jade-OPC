import { ref } from 'vue'
import { useMemoryStore } from '../../stores/memory'
import { useAppStore } from '../../stores/app'

export type AiScenario = 'success' | 'insufficient' | 'unavailable'

const aiScenario = ref<AiScenario>('success')
const saveFailureEnabled = ref(false)
const photoFailureEnabled = ref(false)
const permissionDeniedEnabled = ref(false)
const isResetting = ref(false)
const lastResetError = ref<string | null>(null)

export function useDevScenarios() {
  async function resetSample(sampleMode: 'empty' | 'complete'): Promise<void> {
    if (isResetting.value) return
    isResetting.value = true
    lastResetError.value = null

    try {
      const memoryStore = useMemoryStore()
      await memoryStore.resetSample(sampleMode)
    } catch (e: unknown) {
      lastResetError.value = e instanceof Error ? e.message : 'Unknown reset error'
      throw e
    } finally {
      isResetting.value = false
    }
  }

  function setAiScenario(scenario: AiScenario): void {
    aiScenario.value = scenario
  }

  function toggleSaveFailure(): void {
    saveFailureEnabled.value = !saveFailureEnabled.value
  }

  function togglePhotoFailure(): void {
    photoFailureEnabled.value = !photoFailureEnabled.value
  }

  function togglePermissionDenied(): void {
    permissionDeniedEnabled.value = !permissionDeniedEnabled.value
  }

  function getCurrentMeta() {
    const appStore = useAppStore()
    return {
      schemaVersion: appStore.schemaVersion,
      sampleMode: appStore.sampleMode,
      bootstrapStatus: appStore.bootstrapStatus,
      hasCompletedOnboarding: appStore.hasCompletedOnboarding,
    }
  }

  return {
    aiScenario,
    saveFailureEnabled,
    photoFailureEnabled,
    permissionDeniedEnabled,
    isResetting,
    lastResetError,
    resetSample,
    setAiScenario,
    toggleSaveFailure,
    togglePhotoFailure,
    togglePermissionDenied,
    getCurrentMeta,
  }
}
