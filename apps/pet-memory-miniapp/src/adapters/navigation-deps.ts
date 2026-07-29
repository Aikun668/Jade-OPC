import type { NavigationAdapter } from './navigation'

let _adapter: NavigationAdapter | null = null

export function provideNavigation(adapter: NavigationAdapter): void {
  _adapter = adapter
}

export function getNavigation(): NavigationAdapter {
  if (!_adapter) {
    throw new Error('NavigationAdapter not provided — call provideNavigation() during app setup')
  }
  return _adapter
}

export function _resetNavigation(): void {
  _adapter = null
}
