// 简化版main.js - 避免所有动态导入问题
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 样式
import 'element-plus/dist/index.css'
import './assets/styles/global.scss'

// 创建并配置应用
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 挂载应用 - 不使用Element Plus，先让应用能运行
app.mount('#app')

// 然后再尝试加载Element Plus
window.addEventListener('load', () => {
  import('element-plus').then(module => {
    const ElementPlus = module.default
    app.use(ElementPlus)
    console.log('Element Plus loaded successfully')
  }).catch(err => {
    console.error('Failed to load Element Plus:', err)
  })
})