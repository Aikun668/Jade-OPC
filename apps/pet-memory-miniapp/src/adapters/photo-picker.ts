export interface PickedPhoto {
  uri: string
  width?: number
  height?: number
}

export type PickResult =
  | { kind: 'selected'; photos: PickedPhoto[] }
  | { kind: 'cancelled' }
  | { kind: 'denied' }
  | { kind: 'failed' }

export interface PhotoPicker {
  pick(options: { remaining: number }): Promise<PickResult>
}
