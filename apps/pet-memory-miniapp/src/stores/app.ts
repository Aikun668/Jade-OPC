import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SampleMode } from '../types/domain'
import { getRepository } from './deps'

export type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useAppStore = defineStore('app', () => {
  const bootstrapStatus = ref<BootstrapStatus>('idle')
  const sampleMode = ref<SampleMode>('empty')
  const schemaVersion = ref<number>(1)
  const initError = ref<string | null>(null)
  const devMode = ref<boolean>(false)

  let bootstrapped = false

  async function bootstrap(): Promise<void> {
    if (bootstrapped) return
    bootstrapped = true

    bootstrapStatus.value = 'loading'
    const repo = getRepository()

    try {
      const snapshot = await repo.bootstrap()
      // Import done here to avoid circular dependency
      const { useMemoryStore } = await import('./memory')
      const memoryStore = useMemoryStore()
      memoryStore._commitSnapshot(snapshot)

      sampleMode.value = snapshot.sampleMode
      schemaVersion.value = snapshot.schemaVersion
      initError.value = null
      bootstrapStatus.value = 'ready'
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown bootstrap error'
      initError.value = message
      bootstrapStatus.value = 'error'
    }
  }

  function setDevMode(on: boolean): void {
    devMode.value = on
  }

  function _reset(): void {
    bootstrapStatus.value = 'idle'
    sampleMode.value = 'empty'
    schemaVersion.value = 1
    initError.value = null
    devMode.value = false
    bootstrapped = false
  }

  return {
    bootstrapStatus,
    sampleMode,
    schemaVersion,
    initError,
    devMode,
    bootstrap,
    setDevMode,
    _reset,
  }
})
