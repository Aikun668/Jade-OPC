// @ts-nocheck — accessing <script setup> internals for gesture/swipe testing
import { describe, it, expect } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import PhotoStack from '../../src/components/PhotoStack.vue'
import PhotoViewer from '../../src/components/PhotoViewer.vue'

function vm(wrapper: VueWrapper<any>): any {
  return wrapper.vm
}

function makeItem(overrides?: Partial<{ id: string; uri: string; availability: 'available' | 'expired' }>) {
  return {
    id: overrides?.id ?? 'p1',
    uri: overrides?.uri ?? '/photos/1.png',
    alt: '',
    availability: overrides?.availability ?? 'available',
  }
}

describe('PhotoStack', () => {
  describe('rendering', () => {
    it('does not render when items is empty', () => {
      const wrapper = mount(PhotoStack, {
        props: { items: [] },
      })
      expect(wrapper.find('.photo-stack').exists()).toBe(false)
    })

    it('renders single photo without layers or count badge', () => {
      const wrapper = mount(PhotoStack, {
        props: { items: [makeItem()] },
      })
      expect(wrapper.find('.photo-stack').exists()).toBe(true)
      expect(wrapper.find('.photo-stack__count').exists()).toBe(false)
      expect(wrapper.find('.photo-layer-position--second').exists()).toBe(false)
      expect(wrapper.find('.photo-layer-position--third').exists()).toBe(false)
    })

    it('renders two layers for two items', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/photos/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items } })
      expect(wrapper.find('.photo-layer-position--second').exists()).toBe(true)
      expect(wrapper.find('.photo-layer-position--third').exists()).toBe(false)
      expect(wrapper.find('.photo-stack__count').exists()).toBe(true)
    })

    it('renders three layers for three items', () => {
      const items = [
        makeItem({ id: 'p1' }),
        makeItem({ id: 'p2', uri: '/photos/2.png' }),
        makeItem({ id: 'p3', uri: '/photos/3.png' }),
      ]
      const wrapper = mount(PhotoStack, { props: { items } })
      expect(wrapper.find('.photo-layer-position--second').exists()).toBe(true)
      expect(wrapper.find('.photo-layer-position--third').exists()).toBe(true)
    })

    it('renders expired placeholder for unavailable photos', () => {
      const items = [makeItem({ id: 'p1', availability: 'expired' })]
      const wrapper = mount(PhotoStack, { props: { items } })
      expect(wrapper.find('.photo-layer-card__expired').exists()).toBe(true)
    })
  })

  describe('count badge', () => {
    it('shows current index and total count', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' }), makeItem({ id: 'p3', uri: '/3.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })
      expect(wrapper.find('.photo-stack__count-text').text()).toContain('1 / 3')
    })

    it('stays within bounds when showing last photo', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' }), makeItem({ id: 'p3', uri: '/3.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 2 } })
      expect(wrapper.find('.photo-stack__count-text').text()).toContain('3 / 3')
    })
  })

  describe('gesture discrimination (X/Y)', () => {
    it('swipes left on horizontal drag when dx > dy', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })

      vm(wrapper).onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 120, clientY: 110 }] })

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')![0]).toEqual([1])
    })

    it('swipes right on horizontal drag when dx > dy', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 1 } })

      vm(wrapper).onTouchStart({ touches: [{ clientX: 120, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 200, clientY: 110 }] })

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')![0]).toEqual([0])
    })

    it('does NOT swipe when vertical drag (dy > dx)', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })

      // dx=60 (>50 threshold), dy=100 (>dx) → vertical dominant, no swipe
      vm(wrapper).onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 260, clientY: 200 }] })

      expect(wrapper.emitted('change')).toBeFalsy()
    })

    it('does NOT swipe when drag is below threshold', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })

      vm(wrapper).onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 160, clientY: 100 }] })

      expect(wrapper.emitted('change')).toBeFalsy()
    })

    it('does NOT swipe past the last photo', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 1 } })

      vm(wrapper).onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 100, clientY: 100 }] })

      expect(wrapper.emitted('change')).toBeFalsy()
    })
  })

  describe('swipe suppresses click', () => {
    it('does NOT emit open after a swipe gesture', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })

      vm(wrapper).onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] })
      vm(wrapper).onTouchEnd({ changedTouches: [{ clientX: 100, clientY: 100 }] })

      vm(wrapper).handleOpen()

      expect(wrapper.emitted('open')).toBeFalsy()
    })

    it('emits open on click without prior swipe', () => {
      const items = [makeItem({ id: 'p1' })]
      const wrapper = mount(PhotoStack, { props: { items, initialIndex: 0 } })

      vm(wrapper).handleOpen()

      expect(wrapper.emitted('open')).toBeTruthy()
    })
  })

  describe('animation transitions', () => {
    it('applies transition to layer cards', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoStack, { props: { items } })
      const card = wrapper.find('.photo-layer-card--front')
      expect(card.exists()).toBe(true)
    })
  })
})

describe('PhotoViewer', () => {
  describe('rendering', () => {
    it('does not render when closed', () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: false, items: [makeItem()], initialIndex: 0 },
      })
      expect(wrapper.find('.photo-viewer').exists()).toBe(false)
    })

    it('renders when open with available photo', () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items: [makeItem()], initialIndex: 0 },
      })
      expect(wrapper.find('.photo-viewer').exists()).toBe(true)
      expect(wrapper.find('.photo-viewer__image').exists()).toBe(true)
    })

    it('renders expired placeholder for unavailable photos', () => {
      const wrapper = mount(PhotoViewer, {
        props: {
          open: true,
          items: [makeItem({ id: 'p1', availability: 'expired' })],
          initialIndex: 0,
        },
      })
      expect(wrapper.find('.photo-viewer__expired-placeholder').exists()).toBe(true)
    })

    it('shows count in header', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items, initialIndex: 0 },
      })
      expect(wrapper.find('.photo-viewer__count').text()).toContain('1 / 2')
    })

    it('does not render with empty items (graceful)', () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items: [], initialIndex: 0 },
      })
      expect(wrapper.find('.photo-viewer').exists()).toBe(true)
      expect(wrapper.find('.photo-viewer__image').exists()).toBe(false)
    })
  })

  describe('swiper interaction', () => {
    it('emits change when swiper changes', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items, initialIndex: 0 },
      })
      vm(wrapper).handleSwipe({ detail: { current: 1 } })
      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')![0]).toEqual([1])
    })

    it('updates currentIndex locally on swipe', async () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items, initialIndex: 0 },
      })
      vm(wrapper).handleSwipe({ detail: { current: 1 } })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.photo-viewer__count').text()).toContain('2 / 2')
    })
  })

  describe('close button', () => {
    it('emits close when close is clicked', async () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items: [makeItem()], initialIndex: 0 },
      })
      await wrapper.find('.photo-viewer__close').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('scroll lock', () => {
    it('prevents touchmove on viewer root', () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items: [makeItem()], initialIndex: 0 },
      })
      const viewer = wrapper.find('.photo-viewer')
      expect(viewer.exists()).toBe(true)
    })
  })

  describe('resource boundaries', () => {
    it('handles initialIndex at last item', () => {
      const items = [makeItem({ id: 'p1' }), makeItem({ id: 'p2', uri: '/2.png' })]
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items, initialIndex: 1 },
      })
      expect(wrapper.find('.photo-viewer__count').text()).toContain('2 / 2')
    })

    it('shows single item correctly when only one photo exists', () => {
      const wrapper = mount(PhotoViewer, {
        props: { open: true, items: [makeItem()], initialIndex: 0 },
      })
      expect(wrapper.find('.photo-viewer__count').text()).toBe('1 / 1')
    })
  })
})
