import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UniPhotoPicker } from '../../src/adapters/uni-photo-picker'
import type { PhotoPicker } from '../../src/adapters/photo-picker'

// uni.chooseMedia uses callback pattern: success(result) / fail(error)
const chooseMediaMock = vi.fn()
vi.stubGlobal('uni', {
  chooseMedia: chooseMediaMock,
})

function makePicker(): PhotoPicker {
  return new UniPhotoPicker()
}

function succeed(result: unknown) {
  chooseMediaMock.mockImplementation((opts: { success?: (r: unknown) => void }) => {
    opts.success?.(result)
  })
}

function fail(error: unknown) {
  chooseMediaMock.mockImplementation((opts: { fail?: (e: unknown) => void }) => {
    opts.fail?.(error)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UniPhotoPicker', () => {
  describe('selected', () => {
    it('returns selected with photos on success', async () => {
      succeed({
        tempFiles: [
          { tempFilePath: '/tmp/photo1.jpg', width: 800, height: 600 },
          { tempFilePath: '/tmp/photo2.jpg', width: 1024, height: 768 },
        ],
      })

      const result = await makePicker().pick({ remaining: 2 })

      expect(result.kind).toBe('selected')
      if (result.kind === 'selected') {
        expect(result.photos).toHaveLength(2)
        expect(result.photos[0].uri).toBe('/tmp/photo1.jpg')
        expect(result.photos[0].width).toBe(800)
        expect(result.photos[0].height).toBe(600)
      }
    })

    it('cancelled when tempFiles is empty', async () => {
      succeed({ tempFiles: [] })

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('cancelled')
    })
  })

  describe('cancelled', () => {
    it('returns cancelled when user cancels', async () => {
      fail({ errMsg: 'chooseMedia:fail cancel' })

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('cancelled')
    })
  })

  describe('denied', () => {
    it('returns denied when auth is denied', async () => {
      fail({ errMsg: 'chooseMedia:fail auth deny' })

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('denied')
    })

    it('returns denied when authorization fails', async () => {
      fail({ errMsg: 'authorize:fail' })

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('denied')
    })
  })

  describe('failed', () => {
    it('returns failed for unknown errors', async () => {
      fail({ errMsg: 'chooseMedia:fail internal error' })

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('failed')
    })

    it('returns failed when error has no errMsg', async () => {
      fail(new Error('unexpected'))

      const result = await makePicker().pick({ remaining: 1 })

      expect(result.kind).toBe('failed')
    })
  })

  describe('remaining', () => {
    it('passes remaining as count to uni.chooseMedia', async () => {
      succeed({ tempFiles: [{ tempFilePath: '/tmp/photo.jpg' }] })

      await makePicker().pick({ remaining: 1 })

      expect(chooseMediaMock).toHaveBeenCalledWith({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: expect.any(Function) as unknown,
        fail: expect.any(Function) as unknown,
      })
    })
  })
})
