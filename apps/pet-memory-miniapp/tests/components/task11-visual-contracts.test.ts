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

  it('keeps the portrait onboarding scene edge-to-edge, with the brand above the entry copy and a warm action', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toContain('class="onboarding__content"')
    expect(source).toMatch(/onboarding__content[\s\S]*onboarding__scene[\s\S]*onboarding__footer[\s\S]*onboarding__brand[\s\S]*onboarding__intro/)
    expect(source).toMatch(/\.onboarding__content\s*\{[\s\S]*min-height:\s*100vh/)
    expect(source).toMatch(/\.onboarding__content\s*\{[\s\S]*width:\s*calc\(100% \+ #\{\$pm-page-inline \* 2\}\)/)
    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*font-family:\s*"Songti SC",\s*STSong,\s*serif/)
    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*font-size:\s*72rpx[\s\S]*color:\s*#5b371f/)
    expect(source).toMatch(/\.onboarding__scene\s*\{[\s\S]*position:\s*absolute/)
    expect(source).toMatch(/<PrimaryButton[\s\S]*width="block"/)
    expect(source).toMatch(/\.onboarding__start\s*\{[\s\S]*width:\s*100%/)
    expect(source).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*width:\s*100%/)
  })

  it('keeps the full entry group raised above the picture edge, with privacy underlined first', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toMatch(/onboarding__privacy-link[\s\S]*隐私说明[\s\S]*onboarding__privacy-copy[\s\S]*默认仅存于本机/)
    expect(source).toContain('class="onboarding__privacy"')
    expect(source).toContain('class="onboarding__privacy-link"')
    expect(source).toMatch(/\.onboarding__privacy-link[\s\S]*text-decoration:\s*underline/)
    expect(source).toMatch(/\.onboarding__footer\s*\{[\s\S]*bottom:\s*128rpx/)
    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*margin-bottom:\s*24rpx/)
    expect(source).not.toContain('class="onboarding__lock-icon"')
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
    expect(textRecord).toContain(':focus="textareaFocused"')
    expect(textRecord).toContain('class="record-text__add-photo-icon"')
    expect(textRecord).toContain('compact-intro')
    expect(textRecord).toMatch(/\.record-text__prompt-area\s*\{[\s\S]*padding-top:\s*\$pm-space-2/)
    expect(textRecord).toMatch(/\.record-text__prompt-area\s*\{[\s\S]*gap:\s*\$pm-space-3/)
    expect(textRecord).toMatch(/\.record-text__editor\s*\{[\s\S]*margin-top:\s*\$pm-space-2/)
    expect(textRecord).toMatch(/\.record-text__actions\s*\{[\s\S]*width:\s*100%[\s\S]*transform:\s*translateY\(-\$pm-space-8\)/)
    expect(textRecord).toMatch(/\.record-text__add-photo\s*\{[\s\S]*gap:\s*\$pm-space-2/)
    expect(textRecord).toContain('width="block"')
    expect(textRecord).toMatch(/\.record-text__save\s*\{[\s\S]*width:\s*100%/)
    expect(textRecord).toMatch(/:deep\(\.primary-button\)\s*\{[\s\S]*width:\s*100%/)
    expect(textRecord).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*display:\s*block[\s\S]*width:\s*100%/)
    expect(photoRecord).toContain('class="record-photo__add-photo-icon"')
    expect(photoRecord).toContain('class="record-photo__choice-list"')
    expect(photoRecord).toContain('这已经是一段完整的记忆')
    expect(photoRecord).toContain('只问一个问题，不会自动追问')
    expect(photoRecord).toMatch(/\.record-photo__media\s*\{[\s\S]*aspect-ratio:\s*#\{\$pm-photo-preview-ratio\}/)
    expect(photoRecord).toMatch(/\.record-photo__choice\s*\{[\s\S]*border-bottom:/)
    expect(photoRecord).toContain('compact-intro')
    expect(photoRecord).not.toContain('class="record-photo__list"')
    expect(photoRecord).toContain('class="record-photo__remove-button"')
    expect(photoRecord).toMatch(/<ConfirmDialog[\s\S]*title="要移除这张照片吗？"/)
    expect(photoRecord).toMatch(/\.record-photo__preview\s*\{[\s\S]*margin-top:\s*\$pm-space-4/)
    expect(photoRecord).toMatch(/\.record-photo__photo-actions[\s\S]*:deep\(\.text-action\)[\s\S]*background:\s*\$pm-color-surface/)
    expect(photoRecord).toMatch(/\.record-photo__remove-button\s*\{[\s\S]*border-radius:\s*50%/)
    expect(photoRecord).toContain('<view class="record-photo__choice-list">')
    expect(photoRecord).toContain('<view class="record-photo__session-note">')
    expect(photoRecord).not.toContain('<transition name="record-photo-post">')
    expect(photoRecord).toContain('class="record-photo__post-photo"')
    expect(photoRecord).toContain("'record-photo__post-photo--visible': postPhotoVisible")
    expect(photoRecord).toMatch(/\.record-photo__post-photo\s*\{[\s\S]*transition:/)
    expect(photoRecord).toMatch(/\.record-photo__post-photo\s*\{[\s\S]*transform:\s*translateY\(40rpx\)/)
    expect(photoRecord).toMatch(/\.record-photo__post-photo--visible\s*\{[\s\S]*transform:\s*translateY\(0\)/)
  })

  it('keeps current-state detail and form pages in the reference reading and action hierarchy', () => {
    const home = readFileSync(resolve(__dirname, '../../src/pages/space-home/index.vue'), 'utf-8')
    const detail = readFileSync(resolve(__dirname, '../../src/pages/memory-detail/index.vue'), 'utf-8')
    const photoStack = readFileSync(resolve(__dirname, '../../src/components/PhotoStack.vue'), 'utf-8')
    const edit = readFileSync(resolve(__dirname, '../../src/pages/memory-edit/index.vue'), 'utf-8')
    const aiDraft = readFileSync(resolve(__dirname, '../../src/pages/ai-draft/index.vue'), 'utf-8')
    const settings = readFileSync(resolve(__dirname, '../../src/pages/space-settings/index.vue'), 'utf-8')
    const privacy = readFileSync(resolve(__dirname, '../../src/pages/privacy/index.vue'), 'utf-8')
    const confirmDialog = readFileSync(resolve(__dirname, '../../src/components/ConfirmDialog.vue'), 'utf-8')

    expect(home).toMatch(/\.space-home__primary-action\s*\{[\s\S]*width:\s*100%/)
    expect(detail).toMatch(/\.memory-detail__original\s*\{[\s\S]*border-bottom:/)
    expect(detail).toMatch(/\.memory-detail__ai-invitation\s*\{[\s\S]*background:\s*\$pm-color-surface/)
    expect(detail).toMatch(/\.memory-detail__ai-invitation\s*\{[\s\S]*padding:\s*\$pm-space-4/)
    expect(detail).toMatch(/\.memory-detail__ai-invitation\s*\{[\s\S]*width:\s*100%[\s\S]*box-sizing:\s*border-box/)
    expect(detail).toMatch(/\.memory-detail__ai-hint\s*\{[\s\S]*font-size:\s*\$pm-font-support/)
    expect(detail).toMatch(/\.memory-detail__ai-action[\s\S]*:deep\(\.text-action__label\)[\s\S]*font-size:\s*\$pm-font-body/)
    expect(detail).toMatch(/\.memory-detail__date\s*\{[\s\S]*font-size:\s*\$pm-font-meta/)
    expect(detail).toMatch(/\.memory-detail__date\s*\{[\s\S]*color:\s*\$pm-color-muted[\s\S]*opacity:\s*0\.78/)
    expect(detail).toMatch(/\.memory-detail__date\s*\{[\s\S]*margin-top:\s*\$pm-space-2/)
    expect(detail).toMatch(/\.memory-detail__date\s*\{[\s\S]*margin-bottom:\s*\$pm-space-4/)
    expect(detail).toContain('src="/ui/draft-arrow.svg"')
    expect(detail).toMatch(/\.memory-detail__ai-action\s*\{[\s\S]*width:\s*100%/)
    expect(detail).toMatch(/\.memory-detail__candidate\s*\{[\s\S]*background:\s*\$pm-color-surface/)
    expect(detail).toContain('memory.originalText && !memory.aiCandidateText')
    expect(detail).toContain('v-if="memory.aiCandidateText"')
    expect(detail).toContain('查看并编辑草稿')
    expect(detail).toContain('src="/ui/edit-outline.svg"')
    expect(detail).toContain('src="/ui/trash-outline.svg"')
    expect(detail).toMatch(/\.memory-detail__actions\s*\{[\s\S]*border-top:/)
    expect(photoStack).toMatch(/\.photo-stack\s*\{[\s\S]*border:\s*none[\s\S]*&::after\s*\{[\s\S]*border:\s*none/)
    expect(edit).toContain('layout="standard-flow"')
    expect(edit).toContain('compact-intro')
    expect(edit).toMatch(/\.memory-edit__note\s*\{[\s\S]*margin-bottom:\s*0/)
    expect(edit).toMatch(/\.memory-edit__textarea\s*\{[\s\S]*min-height:\s*520rpx/)
    expect(edit).toMatch(/\.memory-edit__actions\s*\{[\s\S]*width:\s*100%/)
    expect(edit).toMatch(/\.memory-edit__actions\s*\{[\s\S]*min-height:\s*calc\(#\{\$pm-control-height-primary\}\s*\+\s*#\{\$pm-space-3\}\s*\+\s*#\{\$pm-control-height-regular\}\)/)
    expect(edit).toMatch(/<PrimaryButton[\s\S]*width="block"[\s\S]*>\s*保存修改/)
    expect(edit).toMatch(/:deep\(\.primary-button\)\s*\{[\s\S]*display:\s*flex[\s\S]*width:\s*100%[\s\S]*box-sizing:\s*border-box/)
    expect(aiDraft).toMatch(/\.ai-draft__consent\s*\{[\s\S]*background:\s*\$pm-color-olive-soft/)
    expect(aiDraft).toMatch(/\.ai-draft__actions\s*\{[\s\S]*width:\s*100%/)
    expect(aiDraft).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*display:\s*block[\s\S]*width:\s*100%/)
    expect(settings).toMatch(/\.space-settings__cover-has\s*\{[\s\S]*justify-content:\s*center/)
    expect(settings).toMatch(/\.space-settings__cover-image\s*\{[\s\S]*width:\s*\$pm-photo-space-create[\s\S]*height:\s*\$pm-photo-space-create/)
    expect(settings).toMatch(/\.space-settings__cover-add\s*\{[\s\S]*width:\s*\$pm-photo-space-create[\s\S]*height:\s*\$pm-photo-space-create/)
    expect(settings).not.toContain('class="space-settings__photo-icon"')
      expect(settings).toMatch(/:deep\(\.space-settings__cover-remove\)\s*\{[\s\S]*position:\s*absolute[\s\S]*top:\s*-8rpx[\s\S]*right:\s*-8rpx[\s\S]*width:\s*64rpx[\s\S]*height:\s*64rpx/)
      expect(settings).toMatch(/:deep\(\.space-settings__cover-remove\)\s*\{[\s\S]*align-items:\s*flex-start[\s\S]*justify-content:\s*flex-end/)
    expect(settings).toMatch(/:deep\(\.space-settings__cover-replace\)\s*\{[\s\S]*position:\s*absolute[\s\S]*right:\s*8rpx[\s\S]*bottom:\s*8rpx[\s\S]*width:\s*80rpx[\s\S]*height:\s*48rpx[\s\S]*white-space:\s*nowrap/)
    expect(settings).toMatch(/:deep\(\.space-settings__cover-replace \.text-action__label\)\s*\{[\s\S]*white-space:\s*nowrap/)
      expect(settings).toContain('class="space-settings__cover-frame"')
      expect(settings).toContain('class="space-settings__cover-remove"')
      expect(settings).toContain('class="space-settings__close-icon"')
      expect(settings).toContain('src="/ui/close-outline.svg"')
      expect(settings).toContain('class="space-settings__cover-replace"')
    expect(settings).not.toContain('class="space-settings__replace-surface"')
      expect(settings).not.toMatch(/<TextAction[\s\S]*class="space-settings__cover-replace"[\s\S]*space-settings__photo-icon/)
      expect(settings).toMatch(/\.space-settings__close-mark\s*\{[\s\S]*width:\s*24rpx[\s\S]*height:\s*24rpx/)
      expect(settings).toMatch(/:deep\(\.space-settings__cover-replace\)\s*\{[\s\S]*transform:\s*none[\s\S]*transition:\s*none/)
      expect(settings).toMatch(/:deep\(\.space-settings__cover-replace:active\)\s*\{[\s\S]*transform:\s*none[\s\S]*background:\s*rgba\(255, 255, 255, 0\.92\)/)
    expect(settings).toMatch(/<view v-else class="space-settings__cover-empty">[\s\S]*<view class="space-settings__cover-add"[\s\S]*添加照片[\s\S]*<\/view>[\s\S]*<\/view>/)
    expect(settings).not.toMatch(/<view v-else class="space-settings__cover-empty">[\s\S]*space-settings__cover-action/)
    expect(settings).toContain('src="/ui/trash-outline.svg"')
    expect(settings).toMatch(/\.space-settings__save\s*\{[\s\S]*width:\s*100%/)
    expect(settings).toMatch(/<PrimaryButton[\s\S]*width="block"/)
    expect(settings).toMatch(/:deep\(primary-button\)\s*\{[\s\S]*width:\s*100%/)
    expect(settings).toMatch(/:deep\(\.space-settings__delete-action\)\s*\{[\s\S]*width:\s*100%[\s\S]*min-height:\s*\$pm-control-height-primary[\s\S]*background:\s*rgba\(154, 93, 86, 0\.1\)/)
    expect(privacy).toContain('variant="quiet"')
    expect(privacy).toMatch(/\.privacy__confirm\s*\{[\s\S]*width:\s*100%/)
    expect(confirmDialog).not.toMatch(/\.confirm-dialog__action-list\s*\{[\s\S]*?border:\s*\$pm-border-hairline\s+solid\s+\$pm-color-line/)
    expect(confirmDialog).toMatch(/\.confirm-dialog__list-action\s*\+\s*\.confirm-dialog__list-action\)\s*\{[\s\S]*border-top:/)
    expect(confirmDialog).toMatch(/\.confirm-dialog__action-list[\s\S]*:deep\(\.confirm-dialog__list-action\)\s*\{[\s\S]*justify-content:\s*center/)
  })
})
