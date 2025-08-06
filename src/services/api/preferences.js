// services/api/preferences.js - 偏好设置API服务
import { apiClient } from './base'

export const preferencesAPI = {
  /**
   * 获取用户偏好设置
   * @returns {Promise}
   */
  getPreferences() {
    return apiClient.get('/preferences')
  },

  /**
   * 更新用户偏好设置
   * @param {Object} data - 偏好设置
   * @returns {Promise}
   */
  updatePreferences(data) {
    return apiClient.put('/preferences', data)
  },

  /**
   * 获取AI服务状态
   * @returns {Promise}
   */
  getAIServicesStatus() {
    return apiClient.get('/ai-services/status')
  },

  /**
   * 切换建议AI服务
   * @param {Object} data - 服务状态
   * @returns {Promise}
   */
  toggleAssistAI(data) {
    return apiClient.post('/ai-services/assist/toggle', data)
  },

  /**
   * 获取使用习惯分析
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getUsagePatterns(params = {}) {
    return apiClient.get('/usage-patterns', { params })
  },

  /**
   * 获取服务切换历史
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getServiceHistory(params = {}) {
    return apiClient.get('/ai-services/history', { params })
  },

  /**
   * 获取成本警报设置
   * @returns {Promise}
   */
  getCostAlerts() {
    return apiClient.get('/cost-alerts')
  },

  /**
   * 更新成本警报设置
   * @param {Object} data - 警报设置
   * @returns {Promise}
   */
  updateCostAlerts(data) {
    return apiClient.put('/cost-alerts', data)
  }
}