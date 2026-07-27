import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MemoryEntry from '../../src/components/MemoryEntry.vue'
import MemoryList from '../../src/components/MemoryList.vue'
import MissingContentState from '../../src/components/MissingContentState.vue'
import PrimaryButton from '../../src/components/PrimaryButton.vue'

function makeEntry(overrides = {}) {
  return {
    id: 'mem-1',
    summary: '今天带团团去公园散步',
    dateLabel: '2026年7月20日',
    ...overrides,
  }
}

describe('MemoryEntry', () => {
  it('renders summary and date', () => {
    const wrapper = mount(MemoryEntry, {
      props: { item: makeEntry() },
    })
    expect(wrapper.text()).toContain('今天带团团去公园散步')
    expect(wrapper.text()).toContain('2026年7月20日')
  })

  it('shows thumbnail when provided', () => {
    const wrapper = mount(MemoryEntry, {
      props: {
        item: makeEntry({ thumbnailUri: '/photos/dog.jpg' }),
      },
    })
    expect(wrapper.find('.memory-entry__thumbnail-wrap').exists()).toBe(true)
  })

  it('hides thumbnail when not provided', () => {
    const wrapper = mount(MemoryEntry, {
      props: { item: makeEntry({ thumbnailUri: undefined }) },
    })
    expect(wrapper.find('.memory-entry__thumbnail-wrap').exists()).toBe(false)
  })

  it('emits select with memory id on click', async () => {
    const wrapper = mount(MemoryEntry, {
      props: { item: makeEntry() },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['mem-1'])
  })
})

describe('MemoryList', () => {
  it('renders empty slot when items array is empty', () => {
    const wrapper = mount(MemoryList, {
      props: { items: [] },
      slots: { empty: '<text>还没有留下记忆</text>' },
    })
    expect(wrapper.text()).toContain('还没有留下记忆')
  })

  it('renders entries in given order', () => {
    const items = [makeEntry({ id: '1' }), makeEntry({ id: '2' }), makeEntry({ id: '3' })]
    const wrapper = mount(MemoryList, {
      props: { items },
    })
    const entries = wrapper.findAllComponents(MemoryEntry)
    expect(entries).toHaveLength(3)
  })

  it('forwards select from child entry', async () => {
    const items = [makeEntry({ id: 'mem-7' })]
    const wrapper = mount(MemoryList, {
      props: { items },
    })
    await wrapper.findComponent(MemoryEntry).trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['mem-7'])
  })

  it('renders footer slot', () => {
    const items = [makeEntry()]
    const wrapper = mount(MemoryList, {
      props: { items },
      slots: { footer: '<text>查看全部记忆</text>' },
    })
    expect(wrapper.text()).toContain('查看全部记忆')
  })

  it('draws dividers between entries', () => {
    const items = [makeEntry({ id: '1' }), makeEntry({ id: '2' })]
    const wrapper = mount(MemoryList, {
      props: { items },
    })
    expect(wrapper.find('.memory-list__divider').exists()).toBe(true)
  })

  it('does not draw divider before first entry', () => {
    const items = [makeEntry({ id: '1' })]
    const wrapper = mount(MemoryList, { props: { items } })
    // with only 1 entry, no divider should be rendered
    expect(wrapper.find('.memory-list__divider').exists()).toBe(false)
  })
})

describe('MissingContentState', () => {
  it('renders description and action label', () => {
    const wrapper = mount(MissingContentState, {
      props: {
        description: '这段内容已经不在这里',
        actionLabel: '返回空间',
      },
    })
    expect(wrapper.text()).toContain('这段内容已经不在这里')
    expect(wrapper.text()).toContain('返回空间')
  })

  it('uses default title when not provided', () => {
    const wrapper = mount(MissingContentState, {
      props: {
        description: 'test',
        actionLabel: '返回',
      },
    })
    expect(wrapper.text()).toContain('这段内容已经不在这里')
  })

  it('emits action on button press', async () => {
    const wrapper = mount(MissingContentState, {
      props: {
        description: 'test',
        actionLabel: '返回',
      },
    })
    await wrapper.findComponent(PrimaryButton).vm.$emit('press')
    expect(wrapper.emitted('action')).toBeTruthy()
  })
})
