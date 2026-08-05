import type { PhotoPicker, PickResult } from './photo-picker'

interface ChooseMediaFile {
  tempFilePath: string
  width: number
  height: number
}

interface ChooseMediaResult {
  tempFiles: ChooseMediaFile[]
}

export class UniPhotoPicker implements PhotoPicker {
  async pick(options: { remaining: number }): Promise<PickResult> {
    const count = Math.max(1, Math.min(9, options.remaining))
    try {
      const res = await new Promise<ChooseMediaResult>((resolve, reject) => {
        uni.chooseMedia({
          count,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          success: (result) => resolve(result),
          fail: (error) => reject(error),
        })
      })

      if (res.tempFiles.length === 0) {
        return { kind: 'cancelled' }
      }

      return {
        kind: 'selected',
        photos: res.tempFiles.map((f) => ({
          uri: f.tempFilePath,
          width: f.width,
          height: f.height,
        })),
      }
    } catch (e: unknown) {
      const err = e as { errMsg?: string }
      const msg = err.errMsg ?? ''
      if (msg.includes('cancel')) {
        return { kind: 'cancelled' }
      }
      if (msg.includes('auth deny') || msg.includes('authorize')) {
        return { kind: 'denied' }
      }
      return { kind: 'failed' }
    }
  }
}
