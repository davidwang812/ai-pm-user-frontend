// services/api/chat.js - 聊天API服务
import { apiClient } from './base'

export const chatAPI = {
  /**
   * 获取聊天历史（从产品详情中获取）
   * @param {string} productId - 产品ID
   * @returns {Promise}
   */
  getHistory(productId) {
    // 后端的对话历史包含在产品详情中
    return apiClient.get(`/products/${productId}`)
  },

  /**
   * 发送消息到提问AI
   * @param {Object} data - 消息数据
   * @returns {Promise}
   */
  sendToQuestionAI(data) {
    return apiClient.post('/ai/chat/question', {
      product_id: data.productId,
      session_id: data.sessionId,
      user_message: data.message,
      conversation_history: data.history || []
    })
  },

  /**
   * 获取辅助AI建议
   * @param {Object} data - 请求数据
   * @returns {Promise}
   */
  getAssistSuggestions(data) {
    return apiClient.post('/ai/chat/assist', {
      ai_question: data.question,
      conversation_context: data.context,
      industry_context: data.industry,
      refresh_count: data.refreshCount || 0
    })
  },

  /**
   * 生成PRD结构图（绘图AI）
   * @param {Object} data - 请求数据
   * @returns {Promise}
   */
  generatePRDStructure(data) {
    return apiClient.post('/ai/chat/draw', {
      conversation_history: data.history,
      product_info: data.productInfo,
      industry_context: data.industry
    })
  },

  /**
   * 获取AI建议
   * @param {string} productId - 产品ID
   * @param {string} context - 上下文
   * @returns {Promise}
   */
  getSuggestions(productId, context) {
    return apiClient.post('/ai/suggestions', { 
      productId,
      context 
    })
  },

  /**
   * 添加对话到产品
   * @param {string} productId - 产品ID
   * @param {Object} conversation - 对话数据
   * @returns {Promise}
   */
  addConversation(productId, conversation) {
    return apiClient.post(`/products/${productId}/conversation`, conversation)
  },

  /**
   * 导出聊天记录
   * @param {string} productId - 产品ID
   * @param {Object} options - 导出选项
   * @returns {Promise}
   */
  exportChat(productId, options = {}) {
    return apiClient.post(`/products/${productId}/chat/export`, options, {
      responseType: 'blob'
    })
  },

  /**
   * 导出所有聊天记录
   * @param {Object} options - 导出选项
   * @returns {Promise}
   */
  exportChats(options = {}) {
    return apiClient.post('/chats/export', options, {
      responseType: 'blob'
    })
  }
}