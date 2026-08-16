import type { PhotoFileStorage } from './photo-file-storage'

let _storage: PhotoFileStorage | null = null

export function providePhotoFileStorage(storage: PhotoFileStorage): void {
  _storage = storage
}

export function getPhotoFileStorage(): PhotoFileStorage {
  if (!_storage) {
    throw new Error('PhotoFileStorage not provided — call providePhotoFileStorage() during app setup')
  }
  return _storage
}

export function _resetPhotoFileStorage(): void {
  _storage = null
}
