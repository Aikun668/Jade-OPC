import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { UniStorageAdapter } from './adapters/uni-storage'
import { LocalMemoryRepository } from './repositories/local-memory-repository'
import { SystemClock } from './utils/clock-impl'
import { NanoIdFactory } from './utils/id-factory-impl'
import { provideRepository } from './stores/deps'

export function createApp() {
  const app = createSSRApp(App)

  const pinia = createPinia()
  app.use(pinia)

  const storage = new UniStorageAdapter()
  const clock = new SystemClock()
  const idFactory = new NanoIdFactory()
  const repo = new LocalMemoryRepository(storage, clock, idFactory)
  provideRepository(repo)

  return { app, pinia }
}
