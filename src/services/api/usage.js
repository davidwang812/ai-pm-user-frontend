// services/api/usage.js - 使用统计API服务
import { apiClient } from './base'

export const usageAPI = {
  /**
   * 获取使用统计
   * @returns {Promise}
   */
  getStats() {
    return apiClient.get('/usage/stats')
  },

  /**
   * 获取使用历史
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getHistory(params) {
    return apiClient.get('/usage/history', { params })
  },

  /**
   * 获取每日使用统计
   * @param {Object} params - 查询参数 {days: 30}
   * @returns {Promise}
   */
  getDailyUsage(params) {
    return apiClient.get('/usage/daily', { params })
  },

  /**
   * 获取产品使用统计
   * @returns {Promise}
   */
  getProductUsage() {
    return apiClient.get('/usage/by-product')
  },

  /**
   * 导出使用报告
   * @param {Object} data - 导出参数
   * @returns {Promise}
   */
  exportReport(data) {
    return apiClient.post('/usage/export', data, {
      responseType: 'blob'
    })
  }
}