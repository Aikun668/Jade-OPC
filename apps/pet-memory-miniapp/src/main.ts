import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { UniStorageAdapter } from './adapters/uni-storage'
import { LocalMemoryRepository } from './repositories/local-memory-repository'
import { SystemClock } from './utils/clock-impl'
import { NanoIdFactory } from './utils/id-factory-impl'
import { provideRepository } from './stores/deps'
import { UniNavigationAdapter } from './adapters/navigation'
import { provideNavigation } from './adapters/navigation-deps'
import { UniPhotoPicker } from './adapters/uni-photo-picker'
import { providePhotoPicker } from './adapters/photo-picker-deps'
import { UniPhotoFileStorage } from './adapters/uni-photo-file-storage'
import { providePhotoFileStorage } from './adapters/photo-file-storage-deps'
import { MockAiDraftService } from './services/mock-ai-draft-service'
import { provideAiDraftService } from './services/ai-draft-service-deps'
import { useDevScenarios } from './features/developer/dev-scenarios'

export function createApp() {
  const app = createSSRApp(App)

  const pinia = createPinia()
  app.use(pinia)

  const storage = new UniStorageAdapter()
  const photoFileStorage = new UniPhotoFileStorage()
  const clock = new SystemClock()
  const idFactory = new NanoIdFactory()
  const repo = new LocalMemoryRepository(storage, clock, idFactory, photoFileStorage)
  provideRepository(repo)

  providePhotoPicker(new UniPhotoPicker())
  providePhotoFileStorage(photoFileStorage)

  const devScenarios = useDevScenarios()
  provideAiDraftService(
    new MockAiDraftService(() => devScenarios.aiScenario.value),
  )

  provideNavigation(new UniNavigationAdapter(
    (url: string) => uni.navigateTo({ url }).then(() => undefined),
    (delta?: number) => new Promise<void>((resolve, reject) => {
      uni.navigateBack({ delta, success: () => resolve(), fail: reject })
    }),
    (url: string) => uni.redirectTo({ url }).then(() => undefined),
    (url: string) => uni.reLaunch({ url }).then(() => undefined),
    () => getCurrentPages(),
  ))

  return { app, pinia }
}
