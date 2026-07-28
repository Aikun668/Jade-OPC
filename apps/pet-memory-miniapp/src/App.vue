<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from './stores/app'

onLaunch(() => {
  const appStore = useAppStore()
  appStore.bootstrap()
})
</script>

<style lang="scss">
@import './styles/globals.scss';
</style>
