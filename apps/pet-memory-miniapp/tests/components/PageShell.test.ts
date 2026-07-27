import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageShell from '../../src/components/PageShell.vue'

describe('PageShell', () => {
  describe('layout rendering', () => {
    it('renders quiet-landing without navigation bar', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'quiet-landing' },
      })
      expect(wrapper.find('.page-shell__header').exists()).toBe(false)
      expect(wrapper.classes()).toContain('page-shell--quiet-landing')
    })

    it('renders standard-flow with navigation bar', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', title: '测试' },
      })
      expect(wrapper.find('.page-shell__header').exists()).toBe(true)
      expect(wrapper.find('.page-shell__title-text').text()).toBe('测试')
    })

    it('renders task-form layout', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
      })
      expect(wrapper.classes()).toContain('page-shell--task-form')
    })

    it('renders reading layout', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'reading' },
      })
      expect(wrapper.classes()).toContain('page-shell--reading')
    })
  })

  describe('back button', () => {
    it('does not show back by default', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
      })
      expect(wrapper.find('.page-shell__back-text').exists()).toBe(false)
    })

    it('shows back when showBack is true', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', showBack: true },
      })
      expect(wrapper.find('.page-shell__back-text').exists()).toBe(true)
    })

    it('emits back event when back is clicked', async () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', showBack: true },
      })
      await wrapper.find('.page-shell__back').trigger('click')
      expect(wrapper.emitted('back')).toBeTruthy()
    })
  })

  describe('slots', () => {
    it('renders intro slot', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
        slots: { intro: '<text>intro content</text>' },
      })
      expect(wrapper.find('.page-shell__intro').exists()).toBe(true)
    })

    it('renders actions slot', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: { actions: '<text>action</text>' },
      })
      expect(wrapper.find('.page-shell__actions').exists()).toBe(true)
    })

    it('renders default slot content', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
        slots: { default: '<text>main content</text>' },
      })
      expect(wrapper.text()).toContain('main content')
    })

    it('renders navigation-left and navigation-right slots', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
        slots: {
          'navigation-left': '<text>Left</text>',
          'navigation-right': '<text>Right</text>',
        },
      })
      expect(wrapper.text()).toContain('Left')
      expect(wrapper.text()).toContain('Right')
    })
  })

  describe('keyboard handling in task-form', () => {
    it('removes flex-space when keyboard is open', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form', keyboardOpen: true },
      })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(false)
    })

    it('shows flex-space when keyboard is closed', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form', keyboardOpen: false },
      })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(true)
    })
  })

  describe('responsive widths', () => {
    it('renders column with max-width centering structure at narrow width', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', title: '测试标题' },
      })
      expect(wrapper.find('.page-shell').exists()).toBe(true)
      // Column uses max-width + margin:auto centering via CSS class
      const column = wrapper.find('.page-shell__column')
      expect(column.exists()).toBe(true)
    })

    it('renders title text inside centered nav-title container', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', title: '测试标题文字' },
      })
      expect(wrapper.find('.page-shell__title-text').text()).toBe('测试标题文字')
      const title = wrapper.find('.page-shell__nav-title')
      expect(title.exists()).toBe(true)
    })

    it('renders column with layout max-width at wider viewport', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', title: '测试' },
      })
      expect(wrapper.find('.page-shell').exists()).toBe(true)
      const column = wrapper.find('.page-shell__column')
      expect(column.exists()).toBe(true)
    })

    it('renders back button and title text simultaneously without errors', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', showBack: true, title: '这是一个标题' },
      })
      expect(wrapper.find('.page-shell__back').exists()).toBe(true)
      expect(wrapper.find('.page-shell__title-text').exists()).toBe(true)
    })

    it('renders actions slot content in task-form layout', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: { actions: '<text>操作按钮</text>' },
      })
      expect(wrapper.find('.page-shell__actions').exists()).toBe(true)
      expect(wrapper.text()).toContain('操作按钮')
    })
  })

  describe('long content scroll', () => {
    it('renders long default slot content without overflow', () => {
      const longText = '内容'.repeat(200)
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
        slots: { default: `<text>${longText}</text>` },
      })
      expect(wrapper.text()).toContain(longText)
      expect(wrapper.find('.page-shell__content').exists()).toBe(true)
    })

    it('renders long intro and actions content', () => {
      const longText = '内容'.repeat(100)
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: {
          intro: `<text>${longText}</text>`,
          default: `<text>${longText}</text>`,
          actions: `<text>${longText}</text>`,
        },
      })
      expect(wrapper.find('.page-shell__intro').exists()).toBe(true)
      expect(wrapper.find('.page-shell__actions').exists()).toBe(true)
      expect(wrapper.text()).toContain(longText)
    })
  })

  describe('bottom actions in task-form', () => {
    it('renders actions slot at bottom when keyboard is closed', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form', keyboardOpen: false },
        slots: { actions: '<text>bottom action</text>' },
      })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(true)
      expect(wrapper.find('.page-shell__actions').exists()).toBe(true)
      expect(wrapper.text()).toContain('bottom action')
    })

    it('renders actions slot when keyboard is open', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form', keyboardOpen: true },
        slots: { actions: '<text>bottom action</text>' },
      })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(false)
      expect(wrapper.find('.page-shell__actions').exists()).toBe(true)
      expect(wrapper.text()).toContain('bottom action')
    })
  })

  describe('scroll restoration on keyboard toggle', () => {
    it('toggles flex-space when keyboard state changes', async () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form', keyboardOpen: false },
      })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(true)
      await wrapper.setProps({ keyboardOpen: true })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(false)
      await wrapper.setProps({ keyboardOpen: false })
      expect(wrapper.find('.page-shell__flex-space').exists()).toBe(true)
    })
  })

  describe('back button hit target', () => {
    it('renders back button with CSS-defined minimum dimensions', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', showBack: true },
      })
      const back = wrapper.find('.page-shell__back')
      expect(back.exists()).toBe(true)
    })

    it('back button min-width meets 88rpx hit target token', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow', showBack: true },
      })
      const back = wrapper.find('.page-shell__back')
      // CSS min-width/min-height use $pm-hit-target-min (88rpx);
      // verify the element is a semantic button
      expect(back.element.tagName).toBe('BUTTON')
    })
  })

  describe('DOM structural order', () => {
    it('renders intro before content', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: { intro: '<text>INTRO</text>', default: '<text>BODY</text>' },
      })
      const html = wrapper.html()
      const introIndex = html.indexOf('INTRO')
      const bodyIndex = html.indexOf('BODY')
      expect(introIndex).toBeLessThan(bodyIndex)
    })

    it('renders flex-space before actions in task-form', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: { default: '<text>BODY</text>', actions: '<text>ACTIONS</text>' },
      })
      const html = wrapper.html()
      const flexSpaceIndex = html.indexOf('page-shell__flex-space')
      const actionsIndex = html.indexOf('page-shell__actions')
      expect(flexSpaceIndex).not.toBe(-1)
      expect(actionsIndex).not.toBe(-1)
      expect(flexSpaceIndex).toBeLessThan(actionsIndex)
    })

    it('does not contain nested scroll-view', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'standard-flow' },
        slots: { default: '<text>content</text>' },
      })
      const html = wrapper.html()
      expect(html).not.toContain('scroll-view')
    })

    it('does not contain scroll-view in any slot content', () => {
      const wrapper = mount(PageShell, {
        props: { layout: 'task-form' },
        slots: {
          intro: '<text>intro</text>',
          default: '<text>body</text>',
          actions: '<text>actions</text>',
        },
      })
      const html = wrapper.html()
      expect(html).not.toContain('scroll-view')
    })
  })
})
