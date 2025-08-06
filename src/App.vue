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
  
  // 其他全局初始化逻辑
  console.log('AI Product Manager 用户端启动成功')
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}
</style>