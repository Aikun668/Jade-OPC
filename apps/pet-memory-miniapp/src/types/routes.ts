import type { TextRecordEntry } from './domain'

// ---- Route parse result ----

export type RouteParseResult<T> =
  | { kind: 'valid'; value: T }
  | {
      kind: 'invalid'
      reason: 'missing-param' | 'invalid-id' | 'invalid-entry' | 'invalid-source'
      param: 'spaceId' | 'memoryId' | 'entry' | 'draftId' | 'source'
    }

// ---- Memory detail source ----

export type MemoryDetailSource =
  | 'space-home'
  | 'memories'
  | 'new-memory'

export const MEMORY_DETAIL_SOURCES: ReadonlySet<string> = new Set([
  'space-home',
  'memories',
  'new-memory',
])

// ---- Privacy source ----

export type PrivacySource = 'onboarding' | 'settings'

export const PRIVACY_SOURCES: ReadonlySet<string> = new Set([
  'onboarding',
  'settings',
])

// ---- Entry white-list (shared with domain) ----

export const VALID_ENTRIES: ReadonlySet<string> = new Set([
  'daily',
  'photo',
  'meeting',
  'relationship',
])

export function isValidEntry(value: unknown): value is TextRecordEntry {
  return typeof value === 'string' && VALID_ENTRIES.has(value)
}

// ---- ID validation (consistent with Task 3 snapshot-validation) ----

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
