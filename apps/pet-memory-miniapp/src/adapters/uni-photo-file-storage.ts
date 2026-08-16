import type { PhotoFileStorage } from './photo-file-storage'

interface SaveFileResult {
  savedFilePath: string
}

export class UniPhotoFileStorage implements PhotoFileStorage {
  save(tempFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      uni.saveFile({
        tempFilePath,
        success: (result: SaveFileResult) => resolve(result.savedFilePath),
        fail: reject,
      })
    })
  }
}
