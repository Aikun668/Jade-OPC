import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const uniNativeTags = ['swiper', 'swiper-item', 'scroll-view']

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => uniNativeTags.includes(tag),
        },
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
})
