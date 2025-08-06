// main.js - Vue应用入口文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 样式导入
import 'element-plus/dist/index.css'
import '@/assets/styles/global.scss'

// 核心组件和配置
import App from './App.vue'
import router from './router'

// 创建Vue应用
const app = createApp(App)

// 创建Pinia状态管理
const pinia = createPinia()

// 注册Element Plus
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册路由和状态管理
app.use(pinia)
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
  // 可以集成错误上报服务
}

// 挂载应用
app.mount('#app')