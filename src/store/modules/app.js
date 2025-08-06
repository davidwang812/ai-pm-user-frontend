// store/modules/app.js - 应用全局状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏折叠状态
  const sidebarCollapse = ref(false)
  
  // 缓存的页面组件名称
  const cachedViews = ref(['Dashboard', 'ProductList'])
  
  // 全局加载状态
  const globalLoading = ref(false)
  
  // 设备类型
  const device = ref('desktop')
  
  // 主题模式
  const theme = ref(localStorage.getItem('theme') || 'light')
  
  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapse.value = !sidebarCollapse.value
    localStorage.setItem('sidebar-collapse', sidebarCollapse.value)
  }
  
  // 设置侧边栏状态
  const setSidebarCollapse = (collapsed) => {
    sidebarCollapse.value = collapsed
    localStorage.setItem('sidebar-collapse', collapsed)
  }
  
  // 添加缓存页面
  const addCachedView = (name) => {
    if (!cachedViews.value.includes(name)) {
      cachedViews.value.push(name)
    }
  }
  
  // 删除缓存页面
  const removeCachedView = (name) => {
    const index = cachedViews.value.indexOf(name)
    if (index > -1) {
      cachedViews.value.splice(index, 1)
    }
  }
  
  // 清空缓存页面
  const clearCachedViews = () => {
    cachedViews.value = []
  }
  
  // 设置设备类型
  const setDevice = (deviceType) => {
    device.value = deviceType
  }
  
  // 设置主题
  const setTheme = (themeName) => {
    theme.value = themeName
    localStorage.setItem('theme', themeName)
    
    // 更新DOM
    if (themeName === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
  
  // 切换主题
  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }
  
  // 设置全局加载状态
  const setGlobalLoading = (loading) => {
    globalLoading.value = loading
  }
  
  return {
    // 状态
    sidebarCollapse,
    cachedViews,
    globalLoading,
    device,
    theme,
    
    // 方法
    toggleSidebar,
    setSidebarCollapse,
    addCachedView,
    removeCachedView,
    clearCachedViews,
    setDevice,
    setTheme,
    toggleTheme,
    setGlobalLoading
  }
})