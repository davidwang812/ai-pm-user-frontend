// Pinia store 主入口文件
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建 pinia 实例
const pinia = createPinia()

// 使用持久化插件
pinia.use(piniaPluginPersistedstate)

// 导出 store 模块
export { default as useAuthStore } from './modules/auth'
export { default as useUserStore } from './modules/user'
export { default as useAppStore } from './modules/app'
export { default as useProductStore } from './modules/product'
export { default as useChatStore } from './modules/chat'
export { default as useWebSocketStore } from './modules/websocket'

// 导出 pinia 实例
export default pinia