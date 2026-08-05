export type TextEntry = 'daily' | 'photo' | 'meeting' | 'relationship'

const TEXT_ENTRIES: ReadonlySet<string> = new Set(['daily', 'photo', 'meeting', 'relationship'])

export const TEXT_ENTRY_PROMPTS: Record<TextEntry, string> = {
  daily: 'Ta 平时最喜欢待在哪个地方？',
  photo: '看到这张照片时，你最先想起了什么？',
  meeting: '还记得第一次见到 Ta 时，Ta 是什么样子吗？',
  relationship: '如果用一句话形容你和 Ta 的关系，会是什么？',
}

export function isValidTextEntry(entry: unknown): entry is TextEntry {
  return typeof entry === 'string' && TEXT_ENTRIES.has(entry)
}

export function getPrompt(entry: TextEntry): string {
  if (!isValidTextEntry(entry)) {
    throw new Error(`Invalid text entry: ${String(entry)}`)
  }
  return TEXT_ENTRY_PROMPTS[entry]
}
