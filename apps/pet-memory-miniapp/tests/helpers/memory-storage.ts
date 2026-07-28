import type { StorageAdapter } from '../../src/adapters/storage'

/**
 * 测试用内存 StorageAdapter。
 * 支持记录 get/set/remove 调用、注入写入失败。
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, unknown>()
  private _failNextWrite = false
  private _getCalls: string[] = []
  private _setCalls: string[] = []
  private _removeCalls: string[] = []

  get getCalls(): string[] {
    return this._getCalls
  }
  get setCalls(): string[] {
    return this._setCalls
  }
  get removeCalls(): string[] {
    return this._removeCalls
  }

  failNextWrite(): void {
    this._failNextWrite = true
  }

  async get<T>(key: string): Promise<T | null> {
    this._getCalls.push(key)
    return (this.store.get(key) as T) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this._setCalls.push(key)
    if (this._failNextWrite) {
      this._failNextWrite = false
      throw new Error('Injected write failure')
    }
    this.store.set(key, structuredClone(value))
  }

  async remove(key: string): Promise<void> {
    this._removeCalls.push(key)
    this.store.delete(key)
  }

  reset(): void {
    this.store.clear()
    this._getCalls = []
    this._setCalls = []
    this._removeCalls = []
    this._failNextWrite = false
  }
}
