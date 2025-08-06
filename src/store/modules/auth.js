// store/modules/auth.js - 认证状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref(null)
  const tokenExpiry = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  // 检查Token是否过期
  const isTokenExpired = () => {
    if (!tokenExpiry.value) return true
    return new Date().getTime() > tokenExpiry.value
  }

  // 设置认证信息
  const setAuth = (authData) => {
    token.value = authData.token
    refreshToken.value = authData.refreshToken
    user.value = authData.user
    
    // 计算Token过期时间（假设1小时）
    tokenExpiry.value = new Date().getTime() + (authData.expiresIn || 3600) * 1000
    
    // 保存到本地存储
    localStorage.setItem('token', authData.token)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('user', JSON.stringify(authData.user))
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    tokenExpiry.value = null
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('remembered_email')
  }

  // 登录
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      
      if (response.success) {
        setAuth(response.data)
        
        // 记住邮箱
        if (credentials.remember) {
          localStorage.setItem('remembered_email', credentials.email)
        } else {
          localStorage.removeItem('remembered_email')
        }
        
        return response.data
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        // 注册成功后自动登录
        return await login({
          email: userData.email,
          password: userData.password
        })
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = async () => {
    try {
      // 调用登出API
      await authAPI.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      // 无论成功与否都清除本地认证信息
      clearAuth()
      router.push('/login')
    }
  }

  // 刷新Token
  const refreshAuthToken = async () => {
    try {
      const response = await authAPI.refreshToken(refreshToken.value)
      
      if (response.success) {
        token.value = response.data.token
        refreshToken.value = response.data.refreshToken
        tokenExpiry.value = new Date().getTime() + (response.data.expiresIn || 3600) * 1000
        
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        
        return response.data
      } else {
        throw new Error('Token刷新失败')
      }
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await authAPI.getUserInfo()
      
      if (response.success) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        return response.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    // 从本地存储恢复用户信息
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
    
    // 如果有Token但没有用户信息，尝试获取
    if (token.value && !user.value) {
      try {
        await fetchUserInfo()
      } catch (error) {
        clearAuth()
      }
    }
  }

  // 初始化
  initAuth()

  return {
    // 状态
    token,
    user,
    isAuthenticated,
    
    // 方法
    login,
    register,
    logout,
    refreshToken: refreshAuthToken,
    isTokenExpired,
    clearAuth,
    fetchUserInfo
  }
})