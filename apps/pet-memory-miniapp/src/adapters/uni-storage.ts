import type { StorageAdapter } from './storage'

export class UniStorageAdapter implements StorageAdapter {
  get<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      uni.getStorage({
        key,
        success: (res) => {
          resolve((res.data as T) ?? null)
        },
        fail: (err) => {
          // 空键或无数据不视为平台异常
          if (err.errMsg?.includes(': not found') || err.errMsg?.includes(': no data')) {
            resolve(null)
            return
          }
          reject(err)
        },
      })
    })
  }

  set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.setStorage({
        key,
        data: value,
        success: () => {
          resolve()
        },
        fail: (err) => {
          reject(err)
        },
      })
    })
  }

  remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.removeStorage({
        key,
        success: () => {
          resolve()
        },
        fail: (err) => {
          reject(err)
        },
      })
    })
  }
}
