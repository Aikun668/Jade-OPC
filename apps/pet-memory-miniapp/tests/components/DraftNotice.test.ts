import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import DraftNotice from '../../src/components/DraftNotice.vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

function mountDraft(overrides = {}) {
  return mount(DraftNotice, {
    props: { title: '有一段还没写完的记录', ...overrides },
  })
}

describe('DraftNotice', () => {
  it('renders title', () => {
    const wrapper = mountDraft()
    expect(wrapper.text()).toContain('有一段还没写完的记录')
  })

  it('renders custom title', () => {
    const wrapper = mountDraft({ title: '有一条未完成的记录' })
    expect(wrapper.text()).toContain('有一条未完成的记录')
  })

  it('renders continue label and arrow together in button', () => {
    const wrapper = mountDraft({ continueLabel: '继续写' })
    const btn = wrapper.find('.draft-notice__continue-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('继续写')
    // Arrow icon is inside the same button
    expect(btn.find('.draft-notice__arrow-icon').exists()).toBe(true)
  })

  it('emits continue event when button is clicked', async () => {
    const wrapper = mountDraft({ continueLabel: '继续写' })
    await wrapper.find('.draft-notice__continue-btn').trigger('click')
    expect(wrapper.emitted('continue')).toBeTruthy()
    expect(wrapper.emitted('continue')).toHaveLength(1)
  })

  it('clicking arrow icon also emits continue (same button)', async () => {
    const wrapper = mountDraft()
    // Clicking the arrow image should trigger the button's click event
    await wrapper.find('.draft-notice__arrow-icon').trigger('click')
    expect(wrapper.emitted('continue')).toBeTruthy()
  })

  it('renders material image', () => {
    const wrapper = mountDraft()
    expect(wrapper.find('.draft-notice__material').exists()).toBe(true)
    expect(wrapper.find('.draft-notice__material').attributes('src')).toBe('/ui/draft-paper-reference-v5-cropped.png')
    expect(wrapper.find('.draft-notice__tape').exists()).toBe(true)
    expect(wrapper.find('.draft-notice__tape').attributes('src')).toBe('/ui/draft-tape-antique-v3-cropped.png')
  })

  it('uses the baseline paper dimensions and keeps the continuation affordance at the paper edge', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/components/DraftNotice.vue'),
      'utf-8',
    )

    expect(source).toMatch(/\.draft-notice\s*\{[\s\S]*width:\s*\$pm-draft-notice-width/)
    expect(source).toMatch(/\.draft-notice\s*\{[\s\S]*min-height:\s*\$pm-draft-notice-height/)
    expect(source).toMatch(/\.draft-notice__continue-btn\s*\{[\s\S]*margin-right:\s*-\$pm-space-1/)
    expect(source).toMatch(/\.draft-notice__material\s*\{[\s\S]*width:\s*100%/)
    expect(source).toMatch(/\.draft-notice__tape\s*\{[\s\S]*position:\s*absolute/)
    expect(source).toContain('src="/ui/draft-paper-reference-v5-cropped.png"')
    expect(source).toContain('src="/ui/draft-tape-antique-v3-cropped.png"')
    expect(source).not.toContain('draft-notice-paper.png')
    expect(source).not.toContain('linear-gradient(')
    expect(source).not.toContain('clip-path:')
  })

  it('keeps content visible after material load failure', async () => {
    const wrapper = mountDraft()
    await wrapper.find('.draft-notice__material').trigger('error')
    expect(wrapper.text()).toContain('有一段还没写完的记录')
    // Continue button should still be present
    expect(wrapper.find('.draft-notice__continue-btn').exists()).toBe(true)
  })
})
