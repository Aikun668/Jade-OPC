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
          const msg = err.errMsg ?? ''
          // 微信实测 errMsg: "getStorage:fail data not found"
          // 以下模式只匹配「key 不存在 / 无数据 / 空键」语义，不会误吞 quota exceeded / permission denied
          if (
            msg.includes('data not found') ||
            msg.includes(': not found') ||
            msg.includes(': no data') ||
            msg.includes('key is empty')
          ) {
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
