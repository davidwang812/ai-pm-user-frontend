<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

// 初始化主题
const { initTheme } = useTheme()

onMounted(() => {
  // 初始化应用主题
  initTheme()
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}
</style>