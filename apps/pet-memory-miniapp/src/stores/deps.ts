import type { MemoryRepository } from '../types/repository'

let _repo: MemoryRepository | null = null

export function provideRepository(repo: MemoryRepository): void {
  _repo = repo
}

export function getRepository(): MemoryRepository {
  if (!_repo) {
    throw new Error('Repository not provided — call provideRepository() before using stores')
  }
  return _repo
}

export function _resetRepository(): void {
  _repo = null
}
