import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UniPhotoFileStorage } from '../../src/adapters/uni-photo-file-storage'

describe('UniPhotoFileStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('uni', {
      saveFile: vi.fn(({ success }: { success: (result: { savedFilePath: string }) => void }) => {
        success({ savedFilePath: '/saved/cover.jpg' })
      }),
    })
  })

  it('copies a selected temporary file into local persistent storage', async () => {
    const storage = new UniPhotoFileStorage()

    await expect(storage.save('/tmp/cover.jpg')).resolves.toBe('/saved/cover.jpg')
    expect(uni.saveFile).toHaveBeenCalledWith(expect.objectContaining({
      tempFilePath: '/tmp/cover.jpg',
    }))
  })
})
