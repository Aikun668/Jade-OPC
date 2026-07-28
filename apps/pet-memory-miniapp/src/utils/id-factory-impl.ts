import type { IdFactory } from './ids'

export class NanoIdFactory implements IdFactory {
  generate(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).slice(2, 10)
    return `${timestamp}-${random}`
  }
}
