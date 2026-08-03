export type SpaceNameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'too-long'; message: string }

const MAX_NAME_CHARS = 20

export function validateSpaceName(raw: string): SpaceNameValidation {
  const trimmed = raw.trim()

  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty', message: '先写下 Ta 的名字。' }
  }

  // Unicode-aware character count: use spread to handle surrogate pairs
  const charCount = [...trimmed].length

  if (charCount > MAX_NAME_CHARS) {
    return { ok: false, reason: 'too-long', message: 'Ta 的名字最多写 20 个字。' }
  }

  return { ok: true, value: trimmed }
}
