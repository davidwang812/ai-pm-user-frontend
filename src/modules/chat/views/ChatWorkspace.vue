<template>
  <div class="chat-workspace">
    <!-- 头部栏 -->
    <div class="workspace-header">
      <div class="header-left">
        <el-page-header @back="goBack">
          <template #content>
            <div class="product-info">
              <h1 class="product-name">{{ product.name }}</h1>
              <el-tag class="completeness-tag" :type="completenessType">
                完整度 {{ product.completeness }}%
              </el-tag>
            </div>
          </template>
        </el-page-header>
      </div>
      <div class="header-right">
        <el-button :icon="Document" @click="showPRDPreview">
          预览PRD
        </el-button>
        <el-button type="primary" :icon="Download" @click="exportPRD">
          导出PRD
        </el-button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="workspace-body">
      <!-- AI助手列表 -->
      <div class="ai-sidebar">
        <h3 class="sidebar-title">AI助手团队</h3>
        <div class="ai-list">
          <div
            v-for="ai in aiAssistants"
            :key="ai.id"
            class="ai-card"
            :class="{
              active: ai.isActive,
              thinking: ai.isThinking
            }"
          >
            <div class="ai-avatar">
              <el-avatar :size="40" :style="{ backgroundColor: ai.color }">
                {{ ai.name[0] }}
              </el-avatar>
              <div v-if="ai.isThinking" class="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="ai-info">
              <h4 class="ai-name">{{ ai.name }}</h4>
              <p class="ai-role">{{ ai.role }}</p>
              <el-progress
                v-if="ai.progress > 0"
                :percentage="ai.progress"
                :stroke-width="3"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        
        <!-- Token使用情况 -->
        <div class="token-usage">
          <h4 class="usage-title">Token使用情况</h4>
          <div class="usage-stats">
            <div class="stat-item">
              <span class="label">本次对话</span>
              <span class="value">{{ formatNumber(sessionTokens) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">今日剩余</span>
              <span class="value">{{ formatNumber(remainingTokens) }}</span>
            </div>
          </div>
          <el-progress
            :percentage="tokenUsagePercent"
            :color="tokenProgressColor"
            :stroke-width="8"
          />
        </div>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-area">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <el-icon :size="48" color="#409eff">
              <ChatLineSquare />
            </el-icon>
            <h3>欢迎来到AI产品经理工作区</h3>
            <p>我们的AI团队将帮助您打造专业的产品需求文档</p>
            <div class="quick-starts">
              <el-button
                v-for="quick in quickStarts"
                :key="quick.text"
                @click="sendQuickStart(quick.text)"
              >
                {{ quick.label }}
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <TransitionGroup name="message" tag="div">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="message.type"
            >
              <!-- AI消息 -->
              <template v-if="message.type === 'ai'">
                <div class="message-avatar">
                  <el-avatar
                    :size="36"
                    :style="{ backgroundColor: message.ai.color }"
                  >
                    {{ message.ai.name[0] }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender-name">{{ message.ai.name }}</span>
                    <span class="send-time">{{ formatTime(message.time) }}</span>
                  </div>
                  <div class="message-body" v-html="renderMarkdown(message.content)"></div>
                  <!-- AI建议卡片 -->
                  <div v-if="message.suggestions" class="suggestions-card">
                    <h5>建议选项：</h5>
                    <div class="suggestion-items">
                      <el-button
                        v-for="(sug, index) in message.suggestions"
                        :key="index"
                        size="small"
                        @click="sendMessage(sug)"
                      >
                        {{ sug }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 用户消息 -->
              <template v-else-if="message.type === 'user'">
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender-name">您</span>
                    <span class="send-time">{{ formatTime(message.time) }}</span>
                  </div>
                  <div class="message-body">{{ message.content }}</div>
                </div>
                <div class="message-avatar">
                  <el-avatar :size="36">
                    {{ userInitial }}
                  </el-avatar>
                </div>
              </template>

              <!-- 系统消息 -->
              <template v-else-if="message.type === 'system'">
                <div class="system-message">
                  <el-icon><InfoFilled /></el-icon>
                  <span>{{ message.content }}</span>
                </div>
              </template>
            </div>
          </TransitionGroup>

          <!-- AI正在输入提示 -->
          <div v-if="isAITyping" class="typing-indicator">
            <div class="typing-avatar">
              <el-avatar
                :size="36"
                :style="{ backgroundColor: currentTypingAI.color }"
              >
                {{ currentTypingAI.name[0] }}
              </el-avatar>
            </div>
            <div class="typing-content">
              <span class="typing-name">{{ currentTypingAI.name }}</span>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-tools">
            <el-tooltip content="上传文件">
              <el-button :icon="Paperclip" text @click="uploadFile" />
            </el-tooltip>
            <el-tooltip content="插入模板">
              <el-button :icon="Document" text @click="insertTemplate" />
            </el-tooltip>
          </div>
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="inputRows"
            placeholder="输入您的想法，AI团队会帮您完善..."
            @keydown.enter.exact="handleEnter"
            @keydown.enter.shift="handleShiftEnter"
            :disabled="isAITyping"
            resize="none"
            class="message-input"
          />
          <div class="input-actions">
            <span class="char-count">{{ inputMessage.length }}/2000</span>
            <el-button
              type="primary"
              :icon="Promotion"
              @click="sendMessage()"
              :disabled="!inputMessage.trim() || isAITyping"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>

      <!-- PRD预览侧边栏 -->
      <div v-if="showPRD" class="prd-sidebar">
        <div class="prd-header">
          <h3>PRD预览</h3>
          <el-button :icon="Close" text @click="showPRD = false" />
        </div>
        <div class="prd-content">
          <PRDPreview :product-id="productId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document,
  Download,
  ChatLineSquare,
  InfoFilled,
  Paperclip,
  Promotion,
  Close
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { useWebSocket } from '@/composables/useWebSocket'
import { productAPI } from '@/services/api/product'
import { chatAPI } from '@/services/api/chat'
import PRDPreview from '../components/PRDPreview.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 路由和状态
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 产品信息
const productId = route.params.id
const product = ref({
  name: '加载中...',
  completeness: 0
})

// AI助手配置
const aiAssistants = ref([
  {
    id: 'questioning',
    name: '提问AI',
    role: '深度挖掘需求',
    color: '#409eff',
    isActive: false,
    isThinking: false,
    progress: 0
  },
  {
    id: 'assistant',
    name: '助理AI',
    role: '整理归纳信息',
    color: '#67c23a',
    isActive: false,
    isThinking: false,
    progress: 0
  },
  {
    id: 'scoring',
    name: '评分AI',
    role: '质量评估建议',
    color: '#e6a23c',
    isActive: false,
    isThinking: false,
    progress: 0
  },
  {
    id: 'drawing',
    name: '绘图AI',
    role: '原型图设计',
    color: '#f56c6c',
    isActive: false,
    isThinking: false,
    progress: 0
  }
])

// 聊天状态
const messages = ref([])
const inputMessage = ref('')
const isAITyping = ref(false)
const currentTypingAI = ref(null)
const showPRD = ref(false)
const messageListRef = ref(null)

// WebSocket连接
const { connect, disconnect, send, onMessage } = useWebSocket()

// Token统计
const sessionTokens = ref(0)
const remainingTokens = computed(() => {
  return authStore.user?.tokensRemaining || 0
})
const tokenUsagePercent = computed(() => {
  const daily = authStore.user?.subscription?.dailyTokens || 10000
  const used = daily - remainingTokens.value
  return Math.round((used / daily) * 100)
})
const tokenProgressColor = computed(() => {
  const percent = tokenUsagePercent.value
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
})

// 快速开始选项
const quickStarts = [
  { label: '🎯 定义目标用户', text: '帮我定义这个产品的目标用户群体' },
  { label: '💡 核心功能', text: '我想讨论一下产品的核心功能' },
  { label: '📊 竞品分析', text: '请帮我分析一下市场上的竞品' },
  { label: '🚀 开始规划', text: '让我们开始规划产品吧' }
]

// 计算属性
const userInitial = computed(() => {
  return authStore.user?.username?.[0]?.toUpperCase() || 'U'
})

const inputRows = computed(() => {
  const lines = inputMessage.value.split('\n').length
  return Math.min(Math.max(lines, 3), 8)
})

const completenessType = computed(() => {
  const percent = product.value.completeness
  if (percent < 30) return 'danger'
  if (percent < 70) return 'warning'
  return 'success'
})

// 加载产品信息
const loadProduct = async () => {
  try {
    const response = await productAPI.getDetail(productId)
    if (response.success) {
      product.value = response.data
    }
  } catch (error) {
    console.error('加载产品信息失败:', error)
    ElMessage.error('加载产品信息失败')
  }
}

// 加载历史消息
const loadHistory = async () => {
  try {
    const response = await chatAPI.getHistory(productId)
    if (response.success) {
      messages.value = response.data.messages
      sessionTokens.value = response.data.tokensUsed
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  }
}

// 渲染Markdown
const renderMarkdown = (content) => {
  const html = marked(content)
  return DOMPurify.sanitize(html)
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

// 发送消息
const sendMessage = async (content = inputMessage.value) => {
  if (!content.trim()) return
  
  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: content,
    time: new Date()
  }
  messages.value.push(userMessage)
  
  // 清空输入框
  if (content === inputMessage.value) {
    inputMessage.value = ''
  }
  
  // 滚动到底部
  scrollToBottom()
  
  // 发送到服务器
  try {
    send({
      type: 'chat',
      productId: productId,
      message: content
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

// 发送快速开始
const sendQuickStart = (text) => {
  sendMessage(text)
}

// 处理Enter键
const handleEnter = (e) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 处理Shift+Enter
const handleShiftEnter = () => {
  // 默认行为：换行
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 处理WebSocket消息
const handleWSMessage = (data) => {
  switch (data.type) {
    case 'ai_thinking':
      // AI开始思考
      const thinkingAI = aiAssistants.value.find(ai => ai.id === data.aiId)
      if (thinkingAI) {
        thinkingAI.isThinking = true
        thinkingAI.isActive = true
        isAITyping.value = true
        currentTypingAI.value = thinkingAI
      }
      break
      
    case 'ai_response':
      // AI回复
      const respondingAI = aiAssistants.value.find(ai => ai.id === data.aiId)
      if (respondingAI) {
        respondingAI.isThinking = false
        respondingAI.progress = data.progress || 0
        
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          ai: respondingAI,
          content: data.content,
          suggestions: data.suggestions,
          time: new Date()
        }
        messages.value.push(aiMessage)
        
        // 更新Token使用
        sessionTokens.value += data.tokensUsed || 0
        
        isAITyping.value = false
        currentTypingAI.value = null
        scrollToBottom()
      }
      break
      
    case 'progress_update':
      // 更新完整度
      product.value.completeness = data.completeness
      break
      
    case 'system':
      // 系统消息
      messages.value.push({
        id: Date.now(),
        type: 'system',
        content: data.message,
        time: new Date()
      })
      scrollToBottom()
      break
  }
}

// 返回
const goBack = () => {
  router.push('/products')
}

// 显示PRD预览
const showPRDPreview = () => {
  showPRD.value = true
}

// 导出PRD
const exportPRD = async () => {
  try {
    const response = await productAPI.exportPRD(productId, {
      format: 'docx' // 或 'pdf', 'markdown'
    })
    
    // 下载文件
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product.value.name}_PRD.docx`
    a.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('PRD导出成功')
  } catch (error) {
    console.error('导出PRD失败:', error)
    ElMessage.error('导出PRD失败')
  }
}

// 上传文件
const uploadFile = () => {
  ElMessage.info('文件上传功能开发中...')
}

// 插入模板
const insertTemplate = () => {
  ElMessage.info('模板功能开发中...')
}

// 生命周期
onMounted(async () => {
  // 加载产品信息
  await loadProduct()
  
  // 加载历史消息
  await loadHistory()
  
  // 建立WebSocket连接
  connect(`/chat/${productId}`)
  
  // 监听WebSocket消息
  onMessage(handleWSMessage)
})

onUnmounted(() => {
  // 断开WebSocket连接
  disconnect()
})
</script>

<style lang="scss" scoped>
.chat-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

// 头部栏
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  
  .product-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .product-name {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

// 主体区域
.workspace-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// AI侧边栏
.ai-sidebar {
  width: 280px;
  background-color: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  
  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    padding: 20px;
    border-bottom: 1px solid #f0f2f5;
  }
  
  .ai-list {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }
  
  .ai-card {
    display: flex;
    gap: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 8px;
    background-color: #f5f7fa;
    transition: all 0.3s ease;
    
    &.active {
      background-color: #ecf5ff;
      border: 1px solid #409eff;
    }
    
    &.thinking {
      animation: pulse 2s infinite;
    }
    
    .ai-avatar {
      position: relative;
      
      .thinking-indicator {
        position: absolute;
        bottom: -4px;
        right: -4px;
        display: flex;
        gap: 2px;
        
        span {
          width: 4px;
          height: 4px;
          background-color: #409eff;
          border-radius: 50%;
          animation: blink 1.4s infinite;
          
          &:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
    
    .ai-info {
      flex: 1;
      overflow: hidden;
      
      .ai-name {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px;
      }
      
      .ai-role {
        font-size: 12px;
        color: #909399;
        margin: 0 0 8px;
      }
    }
  }
  
  .token-usage {
    padding: 20px;
    border-top: 1px solid #f0f2f5;
    
    .usage-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px;
    }
    
    .usage-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        
        .label {
          font-size: 12px;
          color: #909399;
        }
        
        .value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }
}

// 聊天区域
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
}

// 消息列表
.message-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  
  .welcome-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 16px 0 8px;
    }
    
    p {
      color: #909399;
      margin-bottom: 24px;
    }
    
    .quick-starts {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
  
  .message-item {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    
    &.user {
      flex-direction: row-reverse;
      
      .message-content {
        align-items: flex-end;
        
        .message-body {
          background-color: #409eff;
          color: white;
        }
      }
    }
    
    &.ai {
      .message-body {
        background-color: #f5f7fa;
        color: #303133;
      }
    }
    
    .message-avatar {
      flex-shrink: 0;
    }
    
    .message-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 70%;
      
      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        
        .sender-name {
          font-weight: 600;
          color: #303133;
        }
        
        .send-time {
          color: #909399;
        }
      }
      
      .message-body {
        padding: 12px 16px;
        border-radius: 8px;
        line-height: 1.6;
        word-wrap: break-word;
        
        :deep(p) {
          margin: 0 0 8px;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
        
        :deep(ul), :deep(ol) {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        :deep(code) {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 0.9em;
        }
        
        :deep(pre) {
          background-color: #f5f7fa;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          
          code {
            background-color: transparent;
            padding: 0;
          }
        }
      }
      
      .suggestions-card {
        background-color: #f5f7fa;
        padding: 12px;
        border-radius: 8px;
        
        h5 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        
        .suggestion-items {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }
    }
    
    .system-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      color: #909399;
      font-size: 14px;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .typing-indicator {
    display: flex;
    gap: 12px;
    align-items: center;
    
    .typing-content {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .typing-name {
        font-size: 14px;
        color: #909399;
      }
      
      .typing-dots {
        display: flex;
        gap: 4px;
        
        span {
          width: 8px;
          height: 8px;
          background-color: #909399;
          border-radius: 50%;
          animation: typing 1.4s infinite;
          
          &:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
  }
}

// 输入区域
.input-area {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafbfc;
  
  .input-tools {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .message-input {
    :deep(.el-textarea__inner) {
      font-size: 15px;
      line-height: 1.5;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #dcdfe6;
      
      &:focus {
        border-color: #409eff;
      }
    }
  }
  
  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    
    .char-count {
      font-size: 12px;
      color: #909399;
    }
  }
}

// PRD侧边栏
.prd-sidebar {
  width: 400px;
  background-color: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  
  .prd-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .prd-content {
    flex: 1;
    overflow-y: auto;
  }
}

// 动画
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}

@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

// 消息过渡动画
.message-enter-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

// 响应式设计
@media (max-width: 1200px) {
  .prd-sidebar {
    width: 350px;
  }
}

@media (max-width: 992px) {
  .ai-sidebar {
    display: none;
  }
  
  .prd-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 1000;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .workspace-header {
    padding: 12px 16px;
    
    .product-name {
      font-size: 16px !important;
    }
    
    .header-right {
      .el-button {
        &:not(.el-button--primary) {
          display: none;
        }
      }
    }
  }
  
  .message-list {
    padding: 16px;
    
    .message-item {
      .message-content {
        max-width: 85%;
      }
    }
  }
  
  .input-area {
    padding: 12px 16px;
  }
}
</style>