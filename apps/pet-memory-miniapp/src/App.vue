<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from './stores/app'
import { initPlatformLayout } from './adapters/platform-layout'

onLaunch(() => {
  initPlatformLayout()
  const appStore = useAppStore()
  appStore.bootstrap()
})
</script>

<style lang="scss">
@import './styles/globals.scss';
</style>
