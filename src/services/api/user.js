// services/api/user.js - 用户API服务
import { apiClient } from './base'

export const userAPI = {
  /**
   * 获取用户信息
   * @returns {Promise}
   */
  getProfile() {
    return apiClient.get('/profile')
  },

  /**
   * 更新用户信息
   * @param {Object} data - 用户信息
   * @returns {Promise}
   */
  updateProfile(data) {
    // 适配后端API格式
    const payload = {}
    if (data.nickname !== undefined) payload.nickname = data.nickname
    if (data.company !== undefined) payload.company = data.company
    if (data.avatar !== undefined) payload.avatar_url = data.avatar
    
    return apiClient.put('/profile', payload)
  },

  /**
   * 上传头像
   * @param {FormData} formData - 包含头像文件的表单数据
   * @returns {Promise}
   */
  uploadAvatar(formData) {
    return apiClient.post('/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 发送验证邮件
   * @returns {Promise}
   */
  sendVerificationEmail() {
    return apiClient.post('/email/verify')
  },

  /**
   * 修改密码
   * @param {Object} data - 密码数据
   * @returns {Promise}
   */
  changePassword(data) {
    return apiClient.post('/change-password', {
      current_password: data.oldPassword,
      new_password: data.newPassword
    })
  },

  /**
   * 启用两步验证
   * @returns {Promise}
   */
  enableTwoFactor() {
    return apiClient.post('/2fa/enable')
  },

  /**
   * 禁用两步验证
   * @returns {Promise}
   */
  disableTwoFactor() {
    return apiClient.post('/2fa/disable')
  },

  /**
   * 获取登录历史
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getLoginHistory(params = {}) {
    return apiClient.get('/login-history', { params })
  },

  /**
   * 获取偏好设置
   * @returns {Promise}
   */
  getPreferences() {
    return apiClient.get('/settings')
  },

  /**
   * 更新偏好设置
   * @param {Object} data - 偏好设置
   * @returns {Promise}
   */
  updatePreferences(data) {
    return apiClient.put('/settings', data)
  },

  /**
   * 获取API密钥列表
   * @returns {Promise}
   */
  getApiKeys() {
    return apiClient.get('/api-keys')
  },

  /**
   * 创建API密钥
   * @param {Object} data - 密钥信息
   * @returns {Promise}
   */
  createApiKey(data) {
    return apiClient.post('/api-keys', data)
  },

  /**
   * 删除API密钥
   * @param {string} id - 密钥ID
   * @returns {Promise}
   */
  deleteApiKey(id) {
    return apiClient.delete(`/api-keys/${id}`)
  },

  /**
   * 导出账户数据
   * @param {Object} options - 导出选项
   * @returns {Promise}
   */
  exportAccountData(options = {}) {
    return apiClient.post('/user/export', options, {
      responseType: 'blob'
    })
  },

  /**
   * 获取导出历史
   * @returns {Promise}
   */
  getExportHistory() {
    return apiClient.get('/user/exports')
  },

  /**
   * 下载导出文件
   * @param {string} id - 导出记录ID
   * @returns {Promise}
   */
  downloadExport(id) {
    return apiClient.get(`/user/exports/${id}/download`, {
      responseType: 'blob'
    })
  },

  /**
   * 删除导出记录
   * @param {string} id - 导出记录ID
   * @returns {Promise}
   */
  deleteExport(id) {
    return apiClient.delete(`/user/exports/${id}`)
  }
}