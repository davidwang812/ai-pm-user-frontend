// main.js - Vue应用入口文件
import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 样式导入
import 'element-plus/dist/index.css'
import './assets/styles/global.scss'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册核心功能
app.use(pinia)
app.use(router)

// 使用nextTick确保Vue核心完全初始化
nextTick().then(async () => {
  try {
    // 动态导入Element Plus组件
    const [ElementPlus, zhCn, IconsVue] = await Promise.all([
      import('element-plus'),
      import('element-plus/es/locale/lang/zh-cn'),
      import('@element-plus/icons-vue')
    ])
    
    // 注册Element Plus
    app.use(ElementPlus.default || ElementPlus, {
      locale: zhCn.default || zhCn,
      size: 'default'
    })
    
    // 注册图标组件
    for (const [key, component] of Object.entries(IconsVue)) {
      if (key !== 'default' && component) {
        app.component(key, component)
      }
    }
  } catch (error) {
    console.error('Failed to load Element Plus:', error)
  }
  
  // 全局错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('Application Error:', err)
  }
  
  // 挂载应用
  app.mount('#app')
})