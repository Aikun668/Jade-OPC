import type { Clock } from './dates'

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString()
  }
}
