// services/api/auth.js - 认证API服务
import { apiClient } from './base'

export const authAPI = {
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Promise<LoginResponse>}
   */
  login(credentials) {
    return apiClient.post('/auth/login', {
      username: credentials.email,  // 后端使用username字段接收邮箱
      password: credentials.password
    })
  },

  /**
   * 用户注册
   * @param {Object} userData - 注册信息
   * @param {string} userData.email - 邮箱
   * @param {string} userData.username - 用户名
   * @param {string} userData.password - 密码
   * @returns {Promise<RegisterResponse>}
   */
  register(userData) {
    return apiClient.post('/auth/register', userData)
  },

  /**
   * 用户登出
   * @returns {Promise<void>}
   */
  logout() {
    return apiClient.post('/user/auth/logout')
  },

  /**
   * 刷新Token
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<RefreshResponse>}
   */
  refreshToken(refreshToken) {
    return apiClient.post('/user/auth/refresh', { refreshToken })
  },

  /**
   * 获取用户信息
   * @returns {Promise<UserInfoResponse>}
   */
  getUserInfo() {
    return apiClient.get('/user/auth/current')
  },

  /**
   * 修改密码
   * @param {Object} passwords - 密码信息
   * @param {string} passwords.oldPassword - 旧密码
   * @param {string} passwords.newPassword - 新密码
   * @returns {Promise<Response>}
   */
  changePassword(passwords) {
    return apiClient.post('/user/auth/change-password', passwords)
  },

  /**
   * 发送重置密码邮件
   * @param {string} email - 邮箱地址
   * @returns {Promise<Response>}
   */
  sendResetPasswordEmail(email) {
    return apiClient.post('/user/auth/forgot-password', { email })
  },

  /**
   * 重置密码
   * @param {Object} data - 重置信息
   * @param {string} data.token - 重置令牌
   * @param {string} data.password - 新密码
   * @returns {Promise<Response>}
   */
  resetPassword(data) {
    return apiClient.post('/user/auth/reset-password', data)
  }
}