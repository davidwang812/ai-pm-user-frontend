// services/api/product.js - 产品API服务
import { apiClient } from './base'

export const productAPI = {
  /**
   * 获取产品列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getList(params = {}) {
    return apiClient.get('/products/list', { params })
  },

  /**
   * 获取产品详情
   * @param {string} id - 产品ID
   * @returns {Promise}
   */
  getDetail(id) {
    return apiClient.get(`/products/${id}`)
  },

  /**
   * 创建产品
   * @param {Object} data - 产品数据
   * @returns {Promise}
   */
  create(data) {
    // 适配后端API格式
    return apiClient.post('/products/create', {
      product_name: data.name,
      product_description: data.description
    })
  },

  /**
   * 更新产品
   * @param {string} id - 产品ID
   * @param {Object} data - 更新数据
   * @returns {Promise}
   */
  update(id, data) {
    return apiClient.put(`/products/${id}`, {
      product_name: data.name,
      product_description: data.description,
      industry: data.industry
    })
  },

  /**
   * 删除产品
   * @param {string} id - 产品ID
   * @returns {Promise}
   */
  delete(id) {
    return apiClient.delete(`/products/${id}`)
  },

  /**
   * 复制产品
   * @param {string} id - 产品ID
   * @param {Object} data - 新产品名称
   * @returns {Promise}
   */
  duplicate(id, data) {
    return apiClient.post(`/products/${id}/duplicate`, data)
  },

  /**
   * 获取PRD内容
   * @param {string} id - 产品ID
   * @returns {Promise}
   */
  getPRD(id) {
    // 后端返回产品详情中包含PRD结构
    return apiClient.get(`/products/${id}`)
  },

  /**
   * 导出PRD
   * @param {string} id - 产品ID
   * @param {Object} options - 导出选项
   * @returns {Promise}
   */
  exportPRD(id, options) {
    return apiClient.post(`/products/${id}/export`, options, {
      responseType: 'blob'
    })
  },

  /**
   * 获取产品会话
   * @param {string} id - 产品ID
   * @returns {Promise}
   */
  getSession(id) {
    return apiClient.post(`/products/${id}/session`)
  },

  /**
   * 添加对话
   * @param {string} id - 产品ID
   * @param {Object} data - 对话数据
   * @returns {Promise}
   */
  addConversation(id, data) {
    return apiClient.post(`/products/${id}/conversation`, data)
  },

  /**
   * 更新维度评分
   * @param {string} id - 产品ID
   * @param {Object} dimensions - 维度数据
   * @returns {Promise}
   */
  updateDimensions(id, dimensions) {
    return apiClient.post(`/products/${id}/dimensions`, { dimensions })
  },

  /**
   * 保存Mermaid图表
   * @param {string} id - 产品ID
   * @param {string} mermaidCode - Mermaid代码
   * @returns {Promise}
   */
  saveMermaid(id, mermaidCode) {
    return apiClient.post(`/products/${id}/mermaid`, { mermaidCode })
  },

  /**
   * 导出产品数据
   * @param {Object} options - 导出选项
   * @returns {Promise}
   */
  exportProducts(options) {
    return apiClient.post('/products/export', options, {
      responseType: 'blob'
    })
  }
}