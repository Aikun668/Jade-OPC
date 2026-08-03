import type { PhotoPicker } from './photo-picker'

let _picker: PhotoPicker | null = null

export function providePhotoPicker(picker: PhotoPicker): void {
  _picker = picker
}

export function getPhotoPicker(): PhotoPicker {
  if (!_picker) {
    throw new Error('PhotoPicker not provided — call providePhotoPicker() during app setup')
  }
  return _picker
}

export function _resetPhotoPicker(): void {
  _picker = null
}
