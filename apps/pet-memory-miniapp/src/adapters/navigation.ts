// ---- Page URL map (internal, not exposed) ----

const PAGE_URLS = {
  spaces: '/pages/index/index',
  'space-home': '/pages/space-home/index',
  'memory-detail': '/pages/memory-detail/index',
} as const

const SPACE_HOME_ROUTE = PAGE_URLS['space-home'].replace(/^\//, '')

// ---- Public types ----

export type StableDestination =
  | { page: 'spaces' }
  | { page: 'space-home'; spaceId: string }
  | { page: 'memory-detail'; memoryId: string }

export interface NavigationAdapter {
  push(url: string): Promise<void>
  back(): Promise<void>
  replace(url: string): Promise<void>
  resetTo(destination: StableDestination): Promise<void>
}

// ---- Platform dependencies (injected for testability) ----

type NavFn = (url: string) => Promise<void>
type BackFn = (delta?: number) => Promise<void>
type PageInfo = { route: string }

// ---- Uni-app implementation ----

export class UniNavigationAdapter implements NavigationAdapter {
  constructor(
    private readonly _navigateTo: NavFn,
    private readonly _navigateBack: BackFn,
    private readonly _redirectTo: NavFn,
    private readonly _reLaunch: NavFn,
    private readonly _getCurrentPages: () => PageInfo[],
  ) {}

  push(url: string): Promise<void> {
    return this._navigateTo(url)
  }

  back(): Promise<void> {
    return this._navigateBack()
  }

  replace(url: string): Promise<void> {
    return this._redirectTo(url)
  }

  resetTo(destination: StableDestination): Promise<void> {
    switch (destination.page) {
      case 'spaces':
        return this._reLaunch(PAGE_URLS.spaces)

      case 'space-home':
        return this._reLaunch(
          `${PAGE_URLS['space-home']}?spaceId=${destination.spaceId}`,
        )

      case 'memory-detail': {
        const pages = this._getCurrentPages()
        if (pages.length === 0) {
          return Promise.reject(
            new Error('Cannot reset to memory-detail: no pages in current stack'),
          )
        }

        const reversedIdx = [...pages].reverse().findIndex(
          p => p.route === SPACE_HOME_ROUTE,
        )

        if (reversedIdx === -1) {
          return Promise.reject(
            new Error('Cannot reset to memory-detail: no space-home in current stack'),
          )
        }

        const spaceHomeIdx = pages.length - 1 - reversedIdx
        const delta = pages.length - 1 - spaceHomeIdx

        return this._navigateBack(delta).then(() =>
          this._navigateTo(
            `${PAGE_URLS['memory-detail']}?memoryId=${destination.memoryId}`,
          ),
        )
      }
    }
  }
}
