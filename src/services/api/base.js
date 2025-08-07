// services/api/base.js - API基础配置
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 获取API基础URL
const getBaseURL = () => {
  // 生产环境使用配置的API URL
  if (import.meta.env.PROD && import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/api`
  }
  // 开发环境使用代理
  return '/api'
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加Token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId()
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data
  },
  async (error) => {
    const { config, response } = error
    
    // 网络错误
    if (!response) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }
    
    // 处理不同的错误状态码
    switch (response.status) {
      case 401:
        // Token过期或无效
        if (config.url !== '/user/auth/refresh' && !config._retry) {
          config._retry = true
          
          try {
            // 尝试刷新Token
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const { useAuthStore } = await import('@/store/modules/auth')
              const authStore = useAuthStore()
              await authStore.refreshToken()
              
              // 重新发送原请求
              return apiClient(config)
            }
          } catch (refreshError) {
            // 刷新失败，跳转到登录页
            const { useAuthStore } = await import('@/store/modules/auth')
            const authStore = useAuthStore()
            authStore.clearAuth()
            
            ElMessage.error('登录已过期，请重新登录')
            router.push({
              name: 'Login',
              query: { redirect: router.currentRoute.value.fullPath }
            })
          }
        }
        break
        
      case 403:
        ElMessage.error('没有权限访问该资源')
        break
        
      case 404:
        ElMessage.error('请求的资源不存在')
        break
        
      case 429:
        ElMessage.warning('请求过于频繁，请稍后再试')
        break
        
      case 500:
      case 502:
      case 503:
        ElMessage.error('服务器错误，请稍后再试')
        break
        
      default:
        // 显示后端返回的错误信息
        const errorMessage = response.data?.error?.message || '请求失败'
        ElMessage.error(errorMessage)
    }
    
    return Promise.reject(error)
  }
)

// 生成请求ID
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 创建取消令牌
export function createCancelToken() {
  return axios.CancelToken.source()
}

// 检查是否为取消的请求
export function isCancel(error) {
  return axios.isCancel(error)
}

// Mock API客户端（开发环境使用）
const mockClient = {
  get: (url, config) => {
    console.log(`[Mock] GET ${url}`, config)
    return Promise.resolve(getMockResponse(url, 'GET'))
  },
  post: (url, data, config) => {
    console.log(`[Mock] POST ${url}`, data, config)
    return Promise.resolve(getMockResponse(url, 'POST', data))
  },
  put: (url, data, config) => {
    console.log(`[Mock] PUT ${url}`, data, config)
    return Promise.resolve(getMockResponse(url, 'PUT', data))
  },
  delete: (url, config) => {
    console.log(`[Mock] DELETE ${url}`, config)
    return Promise.resolve(getMockResponse(url, 'DELETE'))
  }
}

// 获取Mock响应
function getMockResponse(url, method, data) {
  // 登录Mock
  if (url === '/user/auth/login' && method === 'POST') {
    return {
      success: true,
      data: {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user_123',
          email: data.email,
          username: 'Mock User',
          subscription: {
            plan: 'free',
            tokensRemaining: 100,
            tokensLimit: 100,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }
    }
  }
  
  // 默认成功响应
  return {
    success: true,
    data: {},
    message: 'Mock response'
  }
}

// 根据环境选择客户端
const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const client = useMock ? mockClient : apiClient

export { client as apiClient }