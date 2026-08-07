import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import PrimaryButton from '../../src/components/PrimaryButton.vue'
import MemoryEntry from '../../src/components/MemoryEntry.vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('Task 11 visual contracts', () => {
  it('renders a quiet primary action without changing its press event', async () => {
    const wrapper = mount(PrimaryButton, {
      props: { variant: 'quiet' },
      slots: { default: '我知道了' },
    })

    expect(wrapper.classes()).toContain('primary-button--quiet')

    await wrapper.trigger('click')
    expect(wrapper.emitted('press')).toHaveLength(1)

    const source = readFileSync(
      resolve(__dirname, '../../src/components/PrimaryButton.vue'),
      'utf-8',
    )
    expect(source).toMatch(/&--quiet\s*\{[\s\S]*background-color:\s*\$pm-color-olive-soft/)
    expect(source).toMatch(/&--quiet\s*\{[\s\S]*color:\s*\$pm-color-olive/)
  })

  it('keeps a stable text column when a memory has no thumbnail', () => {
    const wrapper = mount(MemoryEntry, {
      props: {
        item: {
          id: 'memory-without-photo',
          summary: '团团今天在窗台上晒了一下午太阳。',
          dateLabel: '2026年3月1日',
        },
      },
    })

    expect(wrapper.classes()).toContain('memory-entry--without-thumbnail')
    expect(wrapper.find('.memory-entry__text').exists()).toBe(true)
    expect(wrapper.find('.memory-entry__thumbnail-placeholder').exists()).toBe(true)
    expect(wrapper.find('.memory-entry__placeholder-icon').exists()).toBe(true)
    expect(wrapper.find('.memory-entry__placeholder-label').text()).toBe('补充图片')

    const source = readFileSync(
      resolve(__dirname, '../../src/components/MemoryEntry.vue'),
      'utf-8',
    )
    expect(source).toMatch(/\.memory-entry__thumbnail-placeholder\s*\{[\s\S]*flex-direction:\s*row/)
    expect(source).toMatch(/\.memory-entry__thumbnail-placeholder\s*\{[\s\S]*background:\s*transparent/)
    expect(source).toMatch(/\.memory-entry__thumbnail-placeholder\s*\{[\s\S]*border-color:\s*rgba\(196, 193, 176, 0\.82\)/)
    expect(source).toMatch(/\.memory-entry__placeholder-icon\s*\{[\s\S]*width:\s*24rpx[\s\S]*height:\s*24rpx/)
    expect(source).toMatch(/\.memory-entry__placeholder-label\s*\{[\s\S]*font-size:\s*22rpx/)
  })

  it('keeps the onboarding mark in the same visual content flow as the title and full-width start action', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toContain('class="onboarding__content"')
    expect(source).toMatch(/onboarding__content[\s\S]*onboarding__mark[\s\S]*onboarding__intro/)
    expect(source).toMatch(/<PrimaryButton[\s\S]*width="block"/)
    expect(source).toMatch(/\.onboarding__start\s*\{[\s\S]*width:\s*100%/)
    expect(source).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*width:\s*100%/)
  })

  it('uses a recognizable lock construction for the private-by-default note', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toContain('class="onboarding__lock-shackle"')
    expect(source).toContain('class="onboarding__lock-body"')
    expect(source).toContain('class="onboarding__lock-keyhole"')
    expect(source).toMatch(/\.onboarding__lock-icon\s*\{[\s\S]*position:\s*relative/)
    expect(source).toMatch(/\.onboarding__lock-body\s*\{[\s\S]*border:/)
  })

  it('gives the empty create-space state an explicit field label and secondary leave action', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/space-create/index.vue'),
      'utf-8',
    )

    expect(source).toContain('class="space-create__name-label"')
    expect(source).toContain('照片可以以后再补。名字是这里唯一需要先留下的内容。')
    expect(source).toContain('最多 20 个字。昵称、名字，或者你习惯的称呼都可以。')
    expect(source).toContain('class="space-create__photo-add-icon"')
    expect(source).toMatch(/\.space-create__photo-add\s*\{[\s\S]*width:\s*\$pm-photo-space-create[\s\S]*height:\s*\$pm-photo-space-create/)
    expect(source).toContain('<TextAction @press="handleBack">这次先不创建</TextAction>')
    expect(source).toMatch(/\.space-create__submit\s*\{[\s\S]*width:\s*100%/)
    expect(source).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*width:\s*100%/)
  })

  it('keeps recording affordances inside their calm form surfaces and stretches the save actions', () => {
    const textRecord = readFileSync(
      resolve(__dirname, '../../src/pages/record-text/index.vue'),
      'utf-8',
    )
    const photoRecord = readFileSync(
      resolve(__dirname, '../../src/pages/record-photo/index.vue'),
      'utf-8',
    )

    expect(textRecord).toMatch(/<textarea[\s\S]*\/>\s*<view class="record-text__photos">/)
    expect(textRecord).toMatch(/\.record-text__save\s*\{[\s\S]*width:\s*100%/)
    expect(photoRecord).toMatch(/\.record-photo__save\s*\{[\s\S]*width:\s*100%/)
  })

  it('keeps current-state detail and form pages in the reference reading and action hierarchy', () => {
    const home = readFileSync(resolve(__dirname, '../../src/pages/space-home/index.vue'), 'utf-8')
    const detail = readFileSync(resolve(__dirname, '../../src/pages/memory-detail/index.vue'), 'utf-8')
    const edit = readFileSync(resolve(__dirname, '../../src/pages/memory-edit/index.vue'), 'utf-8')
    const aiDraft = readFileSync(resolve(__dirname, '../../src/pages/ai-draft/index.vue'), 'utf-8')
    const settings = readFileSync(resolve(__dirname, '../../src/pages/space-settings/index.vue'), 'utf-8')
    const privacy = readFileSync(resolve(__dirname, '../../src/pages/privacy/index.vue'), 'utf-8')

    expect(home).toMatch(/\.space-home__primary-action\s*\{[\s\S]*width:\s*100%/)
    expect(detail).toMatch(/\.memory-detail__original\s*\{[\s\S]*border-bottom:/)
    expect(detail).toMatch(/\.memory-detail__ai-invitation\s*\{[\s\S]*background:\s*\$pm-color-olive-soft/)
    expect(edit).toMatch(/\.memory-edit__textarea\s*\{[\s\S]*min-height:\s*520rpx/)
    expect(edit).toMatch(/\.memory-edit__actions\s*\{[\s\S]*width:\s*100%/)
    expect(aiDraft).toMatch(/\.ai-draft__consent\s*\{[\s\S]*background:\s*\$pm-color-olive-soft/)
    expect(aiDraft).toMatch(/\.ai-draft__actions\s*\{[\s\S]*width:\s*100%/)
    expect(settings).toMatch(/\.space-settings__cover-has\s*\{[\s\S]*flex-direction:\s*row/)
    expect(settings).toMatch(/\.space-settings__save\s*\{[\s\S]*width:\s*100%/)
    expect(privacy).toContain('variant="quiet"')
    expect(privacy).toMatch(/\.privacy__confirm\s*\{[\s\S]*width:\s*100%/)
  })
})
