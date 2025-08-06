// services/api/subscription.js - 订阅API服务
import { apiClient } from './base'

export const subscriptionAPI = {
  /**
   * 获取当前套餐信息
   * @returns {Promise}
   */
  getCurrentPlan() {
    return apiClient.get('/user/subscription/current')
  },

  /**
   * 获取套餐列表
   * @returns {Promise}
   */
  getPlans() {
    return apiClient.get('/user/subscription/plans')
  },

  /**
   * 切换套餐（仅限免费套餐）
   * @param {number} planId - 套餐ID
   * @returns {Promise}
   */
  switchPlan(planId) {
    return apiClient.post('/user/subscription/switch', { planId })
  },

  /**
   * 创建订单
   * @param {Object} data - 订单数据
   * @returns {Promise}
   */
  createOrder(data) {
    return apiClient.post('/user/subscription/order', data)
  },

  /**
   * 获取订单状态
   * @param {string} orderId - 订单ID
   * @returns {Promise}
   */
  getOrderStatus(orderId) {
    return apiClient.get(`/user/subscription/order/${orderId}`)
  },

  /**
   * 获取订阅历史
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getHistory(params = {}) {
    return apiClient.get('/user/subscription/history', { params })
  },

  /**
   * 取消订阅
   * @returns {Promise}
   */
  cancel() {
    return apiClient.post('/user/subscription/cancel')
  }
}