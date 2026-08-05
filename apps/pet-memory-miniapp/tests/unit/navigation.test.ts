import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { UniNavigationAdapter, PAGE_URLS, type NavigationAdapter } from '../../src/adapters/navigation'
import type { StableDestination } from '../../src/adapters/navigation'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function createMockPlatform() {
  const navigateTo = vi.fn()
  const navigateBack = vi.fn()
  const redirectTo = vi.fn()
  const reLaunch = vi.fn()
  const getCurrentPages = vi.fn()

  return { navigateTo, navigateBack, redirectTo, reLaunch, getCurrentPages }
}

function createAdapter(overrides: Partial<{
  navigateTo: ReturnType<typeof createMockPlatform>['navigateTo']
  navigateBack: ReturnType<typeof createMockPlatform>['navigateBack']
  redirectTo: ReturnType<typeof createMockPlatform>['redirectTo']
  reLaunch: ReturnType<typeof createMockPlatform>['reLaunch']
  getCurrentPages: ReturnType<typeof createMockPlatform>['getCurrentPages']
}> = {}): NavigationAdapter {
  const mocks = createMockPlatform()
  return new UniNavigationAdapter(
    overrides.navigateTo ?? mocks.navigateTo,
    overrides.navigateBack ?? mocks.navigateBack,
    overrides.redirectTo ?? mocks.redirectTo,
    overrides.reLaunch ?? mocks.reLaunch,
    overrides.getCurrentPages ?? mocks.getCurrentPages,
  )
}

// ---- push ----

describe('push', () => {
  it('T4B-M01: push calls navigateTo one-to-one', async () => {
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ navigateTo })
    await adapter.push('/pages/space-home/index?spaceId=s1')
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/pages/space-home/index?spaceId=s1')
  })

  it('T4B-M04: push resolves on success', async () => {
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ navigateTo })
    await expect(adapter.push('/pages/spaces/index')).resolves.toBeUndefined()
  })

  it('T4B-M04: push rejects on failure', async () => {
    const navigateTo = vi.fn().mockRejectedValue(new Error('navigateTo failed'))
    const adapter = createAdapter({ navigateTo })
    await expect(adapter.push('/pages/spaces/index')).rejects.toThrow('navigateTo failed')
  })
})

// ---- back ----

describe('back', () => {
  it('T4B-M02: back calls navigateBack one-to-one', async () => {
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ navigateBack })
    await adapter.back()
    expect(navigateBack).toHaveBeenCalledTimes(1)
  })

  it('T4B-M02: back does not use reLaunch', async () => {
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const reLaunch = vi.fn()
    const adapter = createAdapter({ navigateBack, reLaunch })
    await adapter.back()
    expect(navigateBack).toHaveBeenCalled()
    expect(reLaunch).not.toHaveBeenCalled()
  })

  it('T4B-M04: back resolves on success', async () => {
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ navigateBack })
    await expect(adapter.back()).resolves.toBeUndefined()
  })

  it('T4B-M04: back rejects on failure', async () => {
    const navigateBack = vi.fn().mockRejectedValue(new Error('navigateBack failed'))
    const adapter = createAdapter({ navigateBack })
    await expect(adapter.back()).rejects.toThrow('navigateBack failed')
  })
})

// ---- replace ----

describe('replace', () => {
  it('T4B-M03: replace calls redirectTo one-to-one', async () => {
    const redirectTo = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ redirectTo })
    await adapter.replace('/pages/space-home/index?spaceId=s1')
    expect(redirectTo).toHaveBeenCalledTimes(1)
    expect(redirectTo).toHaveBeenCalledWith('/pages/space-home/index?spaceId=s1')
  })

  it('T4B-M04: replace resolves on success', async () => {
    const redirectTo = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ redirectTo })
    await expect(adapter.replace('/pages/spaces/index')).resolves.toBeUndefined()
  })

  it('T4B-M04: replace rejects on failure', async () => {
    const redirectTo = vi.fn().mockRejectedValue(new Error('redirectTo failed'))
    const adapter = createAdapter({ redirectTo })
    await expect(adapter.replace('/pages/spaces/index')).rejects.toThrow('redirectTo failed')
  })
})

// ---- resetTo ----

describe('resetTo', () => {
  describe('spaces', () => {
    it('T4B-M07: spaces uses reLaunch to space list root', async () => {
      const reLaunch = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn()
      const adapter = createAdapter({ reLaunch, navigateTo })
      await adapter.resetTo({ page: 'spaces' })
      expect(reLaunch).toHaveBeenCalledTimes(1)
      expect(reLaunch).toHaveBeenCalledWith('/pages/spaces/index')
    })

    it('T4B-M07: spaces reLaunch does not depend on current stack', async () => {
      const reLaunch = vi.fn().mockResolvedValue(undefined)
      const getCurrentPages = vi.fn()
      const adapter = createAdapter({ reLaunch, getCurrentPages })
      await adapter.resetTo({ page: 'spaces' })
      expect(reLaunch).toHaveBeenCalledWith('/pages/spaces/index')
      expect(getCurrentPages).not.toHaveBeenCalled()
    })

    it('T4B-M11: resetTo spaces does not use push', async () => {
      const reLaunch = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn()
      const adapter = createAdapter({ reLaunch, navigateTo })
      await adapter.resetTo({ page: 'spaces' })
      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('space-home', () => {
    it('T4B-M08: space-home uses reLaunch with spaceId', async () => {
      const reLaunch = vi.fn().mockResolvedValue(undefined)
      const adapter = createAdapter({ reLaunch })
      await adapter.resetTo({ page: 'space-home', spaceId: 's1' })
      expect(reLaunch).toHaveBeenCalledTimes(1)
      expect(reLaunch).toHaveBeenCalledWith('/pages/space-home/index?spaceId=s1')
    })

    it('T4B-M08: space-home reLaunch does not use push', async () => {
      const reLaunch = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn()
      const adapter = createAdapter({ reLaunch, navigateTo })
      await adapter.resetTo({ page: 'space-home', spaceId: 's2' })
      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('memory-detail', () => {
    it('T4B-M09: memory-detail navigates back to space-home then pushes detail', async () => {
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockResolvedValue(undefined)
      const reLaunch = vi.fn()
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
        { route: 'pages/memory-create/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, reLaunch, getCurrentPages })
      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })

      // Should navigateBack first, then push
      expect(navigateBack).toHaveBeenCalledTimes(1)
      // delta = 1 (go back from create to space-home)
      expect(navigateBack).toHaveBeenCalledWith(1)
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith('/pages/memory-detail/index?memoryId=m1')
      expect(reLaunch).not.toHaveBeenCalled()
    })

    it('T4B-M09: memory-detail preserves space-home in stack', async () => {
      // 05/06/07 temp flows end, stable return is space-home
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockResolvedValue(undefined)
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
        { route: 'pages/photo-record/index' },
        { route: 'pages/memory-preview/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm2' })

      // delta = 2 (back from preview → photo-record → space-home)
      expect(navigateBack).toHaveBeenCalledWith(2)
      expect(navigateTo).toHaveBeenCalledWith('/pages/memory-detail/index?memoryId=m2')
    })

    it('T4B-M16: memory-detail without space-home in stack rejects', async () => {
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
      ])

      const adapter = createAdapter({ getCurrentPages })
      await expect(
        adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })
      ).rejects.toThrow('space-home')
    })

    it('T4B-M16: memory-detail with empty stack rejects', async () => {
      const getCurrentPages = vi.fn().mockReturnValue([])

      const adapter = createAdapter({ getCurrentPages })
      await expect(
        adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })
      ).rejects.toThrow('no pages in current stack')
    })

    it('delta=0 when space-home is the current top page', async () => {
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockResolvedValue(undefined)
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/space-home/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })

      expect(navigateBack).toHaveBeenCalledWith(0)
      expect(navigateTo).toHaveBeenCalledWith('/pages/memory-detail/index?memoryId=m1')
    })

    it('navigateTo failure after successful navigateBack is propagated', async () => {
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockRejectedValue(new Error('navigateTo failed'))
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
      await expect(
        adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' }),
      ).rejects.toThrow('navigateTo failed')
    })

    it('T4B-M10: uses explicit delta calculation not blind navigateBack', async () => {
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockResolvedValue(undefined)
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
        { route: 'pages/photo-record/index' },
        { route: 'pages/text-record/index' },
        { route: 'pages/memory-preview/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm3' })

      // delta = 3 to go from preview back to space-home
      expect(navigateBack).toHaveBeenCalledWith(3)
    })

    it('T4B-M14: repeated calls with same destination work', async () => {
      const navigateBack = vi.fn().mockResolvedValue(undefined)
      const navigateTo = vi.fn().mockResolvedValue(undefined)
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
      ])

      const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })

      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })
      await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })

      expect(navigateBack).toHaveBeenCalledTimes(2)
      expect(navigateTo).toHaveBeenCalledTimes(2)
    })
  })

  describe('resetTo failure propagation', () => {
    it('reLaunch failure is propagated', async () => {
      const reLaunch = vi.fn().mockRejectedValue(new Error('reLaunch failed'))
      const adapter = createAdapter({ reLaunch })
      await expect(adapter.resetTo({ page: 'spaces' })).rejects.toThrow('reLaunch failed')
    })

    it('navigateBack failure during memory-detail is propagated', async () => {
      const navigateBack = vi.fn().mockRejectedValue(new Error('back failed'))
      const getCurrentPages = vi.fn().mockReturnValue([
        { route: 'pages/spaces/index' },
        { route: 'pages/space-home/index' },
        { route: 'pages/photo-record/index' },
      ])

      const adapter = createAdapter({ navigateBack, getCurrentPages })
      await expect(
        adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' })
      ).rejects.toThrow('back failed')
    })
  })
})

// ---- T4B-M15: no private data in stable destinations ----

describe('StableDestination privacy', () => {
  it('T4B-M15: destinations do not contain space name, original text, photo URI, or full objects', () => {
    // Type-level check: StableDestination only allows page + required IDs
    const dests: StableDestination[] = [
      { page: 'spaces' },
      { page: 'space-home', spaceId: 's1' },
      { page: 'memory-detail', memoryId: 'm1', source: 'new-memory' },
    ]

    for (const d of dests) {
      const keys = Object.keys(d)
      expect(keys).toContain('page')
      // No extra private fields
      expect(keys.every(k => ['page', 'spaceId', 'memoryId', 'source'].includes(k))).toBe(true)
    }
  })
})

// ---- Task 8: memory-detail with source, new PAGE_URLS ----

describe('Task 8 navigation', () => {
  it('T8-N01: PAGE_URLS includes memory-edit', () => {
    expect(PAGE_URLS['memory-edit']).toBe('/pages/memory-edit/index')
  })

  it('T8-N02: PAGE_URLS includes ai-draft', () => {
    expect(PAGE_URLS['ai-draft']).toBe('/pages/ai-draft/index')
  })

  it('T8-N03: memory-detail with source=new-memory includes source in URL', async () => {
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const getCurrentPages = vi.fn().mockReturnValue([
      { route: 'pages/space-home/index' },
    ])

    const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
    await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1', source: 'new-memory' })

    expect(navigateTo).toHaveBeenCalledWith(
      '/pages/memory-detail/index?memoryId=m1&source=new-memory',
    )
  })

  it('T8-N04: memory-detail with source=space-home includes source in URL', async () => {
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const getCurrentPages = vi.fn().mockReturnValue([
      { route: 'pages/space-home/index' },
    ])

    const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
    await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1', source: 'space-home' })

    expect(navigateTo).toHaveBeenCalledWith(
      '/pages/memory-detail/index?memoryId=m1&source=space-home',
    )
  })

  it('T8-N05: memory-detail backward compat (no source in resetTo call)', async () => {
    // If source is not passed, the URL should still work with just memoryId
    // (page will default to space-home on parse)
    const navigateBack = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const getCurrentPages = vi.fn().mockReturnValue([
      { route: 'pages/space-home/index' },
    ])

    const adapter = createAdapter({ navigateBack, navigateTo, getCurrentPages })
    await adapter.resetTo({ page: 'memory-detail', memoryId: 'm1' } as any)

    expect(navigateTo).toHaveBeenCalledWith('/pages/memory-detail/index?memoryId=m1')
  })
})

// ---- T4B-M21: Adapter does not read Pinia or Repository ----

// ---- Task 9: space-settings navigation ----

describe('Task 9 navigation', () => {
  it('T9-N01: PAGE_URLS includes space-settings', () => {
    expect(PAGE_URLS['space-settings']).toBe('/pages/space-settings/index')
  })

  it('T9-N02: push space-settings with spaceId works', async () => {
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const adapter = createAdapter({ navigateTo })
    await adapter.push('/pages/space-settings/index?spaceId=s1')
    expect(navigateTo).toHaveBeenCalledWith('/pages/space-settings/index?spaceId=s1')
  })
})

describe('Adapter isolation', () => {
  it('T4B-M21: adapter does not import Pinia or Repository', () => {
    const src = readFileSync(
      join(__dirname, '../../src/adapters/navigation.ts'),
      'utf-8'
    )
    expect(src).not.toMatch(/pinia|useStore|MemoryRepository|from.*stores/)
  })
})
