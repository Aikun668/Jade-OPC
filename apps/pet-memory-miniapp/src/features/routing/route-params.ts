import type { TextRecordEntry } from '../../types/domain'
import type { MemoryDetailSource, PrivacySource, RouteParseResult } from '../../types/routes'
import { isValidEntry, isValidId, MEMORY_DETAIL_SOURCES, PRIVACY_SOURCES } from '../../types/routes'

type IdParam = 'spaceId' | 'memoryId'
type InvalidReason = 'missing-param' | 'invalid-id' | 'invalid-entry'

type IdParseResult =
  | { ok: true; value: string }
  | { ok: false; reason: InvalidReason; param: IdParam }

function readStringParam(query: Record<string, unknown>, key: string): unknown {
  const raw = query[key]
  if (raw === undefined || raw === null) return undefined
  if (typeof raw === 'function') return undefined
  return raw
}

// parseId = Task 3 基础规则（isValidId：非空 string）+ 路由层额外约束（拒绝纯空格、JSON 串）
function parseId(query: Record<string, unknown>, key: IdParam): IdParseResult {
  const raw = readStringParam(query, key)
  if (raw === undefined) {
    return { ok: false, reason: 'missing-param', param: key }
  }
  if (!isValidId(raw)) {
    return { ok: false, reason: 'invalid-id', param: key }
  }
  const id = raw
  const trimmed = id.trim()
  if (trimmed.length === 0) {
    return { ok: false, reason: 'invalid-id', param: key }
  }
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return { ok: false, reason: 'invalid-id', param: key }
  }
  return { ok: true, value: trimmed }
}

// ---- Public API ----

export function parseSpaceRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ spaceId: string }> {
  const parsed = parseId(query, 'spaceId')
  if (!parsed.ok) return { kind: 'invalid', reason: parsed.reason, param: parsed.param }
  return { kind: 'valid', value: { spaceId: parsed.value } }
}

export function parseMemoryRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ memoryId: string }> {
  const parsed = parseId(query, 'memoryId')
  if (!parsed.ok) return { kind: 'invalid', reason: parsed.reason, param: parsed.param }
  return { kind: 'valid', value: { memoryId: parsed.value } }
}

export function parseRecordEntryRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ spaceId: string }> {
  return parseSpaceRoute(query)
}

export function parseMemoryDetailRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ memoryId: string; source: MemoryDetailSource }> {
  const parsed = parseId(query, 'memoryId')
  if (!parsed.ok) return { kind: 'invalid', reason: parsed.reason, param: parsed.param }

  const raw = readStringParam(query, 'source')
  if (raw === undefined) {
    return { kind: 'valid', value: { memoryId: parsed.value, source: 'space-home' } }
  }

  if (typeof raw !== 'string' || !MEMORY_DETAIL_SOURCES.has(raw)) {
    return { kind: 'invalid', reason: 'invalid-source', param: 'source' }
  }

  return { kind: 'valid', value: { memoryId: parsed.value, source: raw as MemoryDetailSource } }
}

export function parsePhotoRecordRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ spaceId: string }> {
  return parseSpaceRoute(query)
}

export function parseTextRecordRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ spaceId: string; entry?: TextRecordEntry; draftId?: string }> {
  const parsed = parseId(query, 'spaceId')
  if (!parsed.ok) return { kind: 'invalid', reason: parsed.reason, param: parsed.param }

  const raw = readStringParam(query, 'entry')
  if (raw !== undefined && !isValidEntry(raw)) {
    return { kind: 'invalid', reason: 'invalid-entry', param: 'entry' }
  }

  const draftId = readStringParam(query, 'draftId')
  const value: { spaceId: string; entry?: TextRecordEntry; draftId?: string } = {
    spaceId: parsed.value,
    entry: raw as TextRecordEntry | undefined,
  }
  if (typeof draftId === 'string' && draftId.trim().length > 0) {
    if (!isValidId(draftId)) return { kind: 'invalid', reason: 'invalid-id', param: 'draftId' }
    value.draftId = draftId.trim()
  }

  if (raw === undefined && !value.draftId) {
    return { kind: 'invalid', reason: 'missing-param', param: 'entry' }
  }

  return { kind: 'valid', value }
}

export function parseSpaceSettingsRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ spaceId: string }> {
  const parsed = parseId(query, 'spaceId')
  if (!parsed.ok) return { kind: 'invalid', reason: parsed.reason, param: parsed.param }
  return { kind: 'valid', value: { spaceId: parsed.value } }
}

export function parsePrivacyRoute(
  query: Record<string, unknown>,
): RouteParseResult<{ source: PrivacySource }> {
  const raw = readStringParam(query, 'source')
  if (raw === undefined) {
    return { kind: 'invalid', reason: 'missing-param', param: 'source' }
  }
  if (typeof raw !== 'string' || !PRIVACY_SOURCES.has(raw)) {
    return { kind: 'invalid', reason: 'invalid-source', param: 'source' }
  }
  return { kind: 'valid', value: { source: raw as PrivacySource } }
}
