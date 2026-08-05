export type ExitAction = 'save-draft' | 'discard'

export type ResumeAction = 'continue-this' | 'start-new' | 'not-now'

export function isDirtyText(text: string): boolean {
  return text.trim().length > 0
}

export function resolveExitAction(text: string): ExitAction {
  return isDirtyText(text) ? 'save-draft' : 'discard'
}

export function isDirtyAssets(
  initialAssetIds: readonly string[],
  currentAssetIds: readonly string[],
): boolean {
  if (initialAssetIds.length !== currentAssetIds.length) return true
  return !initialAssetIds.every((id, i) => id === currentAssetIds[i])
}

export function resolveResumeAction(_hasExistingDraft: boolean): ResumeAction[] {
  return ['continue-this', 'start-new', 'not-now']
}
