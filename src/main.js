// main.js - Vue应用入口文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 样式导入 - 必须在这里导入
import 'element-plus/dist/index.css'
import './assets/styles/global.scss'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册核心功能
app.use(pinia)
app.use(router)

// 延迟加载Element Plus - 避免循环依赖
setTimeout(() => {
  import('element-plus').then(ElementPlus => {
    import('element-plus/es/locale/lang/zh-cn').then(zhCn => {
      app.use(ElementPlus.default, {
        locale: zhCn.default,
        size: 'default'
      })
    })
  })
  
  // 延迟加载图标
  import('@element-plus/icons-vue').then(IconsVue => {
    for (const [key, component] of Object.entries(IconsVue)) {
      if (key !== 'default') {
        app.component(key, component)
      }
    }
  })
}, 0)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
}

// 挂载应用
app.mount('#app')