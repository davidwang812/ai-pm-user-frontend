// composables/useTheme.js - 主题管理组合式函数
import { ref, computed, watch, onMounted } from 'vue'

// 主题状态
const theme = ref(localStorage.getItem('theme') || 'light')

// 是否为暗色主题
const isDark = computed(() => theme.value === 'dark')

// 切换主题
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// 设置主题
const setTheme = (newTheme) => {
  theme.value = newTheme
}

// 应用主题到DOM
const applyTheme = () => {
  const root = document.documentElement
  
  if (isDark.value) {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
  
  // 保存到本地存储
  localStorage.setItem('theme', theme.value)
}

// 监听主题变化
watch(theme, () => {
  applyTheme()
})

// 初始化主题
const initTheme = () => {
  // 检查系统主题偏好
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
  }
  
  // 应用主题
  applyTheme()
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  })
}

export function useTheme() {
  onMounted(() => {
    initTheme()
  })
  
  return {
    theme,
    isDark,
    toggleTheme,
    setTheme
  }
}