// composables/useWebSocket.js - WebSocket连接管理
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'

export function useWebSocket() {
  const authStore = useAuthStore()
  const ws = ref(null)
  const isConnected = ref(false)
  const reconnectTimer = ref(null)
  const heartbeatTimer = ref(null)
  const messageHandlers = ref([])
  
  // WebSocket URL
  const getWebSocketUrl = (path = '') => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_URL || window.location.host
    return `${protocol}//${host}/ws${path}`
  }
  
  // 连接WebSocket
  const connect = (path = '', options = {}) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }
    
    const url = getWebSocketUrl(path)
    console.log('Connecting to WebSocket:', url)
    
    try {
      ws.value = new WebSocket(url)
      
      // 连接打开
      ws.value.onopen = () => {
        console.log('WebSocket connected')
        isConnected.value = true
        
        // 发送认证信息
        if (authStore.token) {
          send({
            type: 'auth',
            token: authStore.token
          })
        }
        
        // 启动心跳
        startHeartbeat()
        
        // 执行连接成功回调
        if (options.onOpen) {
          options.onOpen()
        }
      }
      
      // 接收消息
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          
          // 处理心跳响应
          if (data.type === 'pong') {
            return
          }
          
          // 执行消息处理器
          messageHandlers.value.forEach(handler => {
            handler(data)
          })
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      // 连接关闭
      ws.value.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        isConnected.value = false
        stopHeartbeat()
        
        // 非正常关闭，尝试重连
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect(path, options)
        }
        
        // 执行关闭回调
        if (options.onClose) {
          options.onClose(event)
        }
      }
      
      // 连接错误
      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        ElMessage.error('连接失败，正在重试...')
        
        // 执行错误回调
        if (options.onError) {
          options.onError(error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      ElMessage.error('创建连接失败')
    }
  }
  
  // 断开连接
  const disconnect = () => {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
    
    stopHeartbeat()
    
    if (ws.value) {
      ws.value.close(1000, 'User disconnect')
      ws.value = null
    }
    
    isConnected.value = false
  }
  
  // 发送消息
  const send = (data) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return false
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      ws.value.send(message)
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }
  
  // 添加消息处理器
  const onMessage = (handler) => {
    messageHandlers.value.push(handler)
    
    // 返回移除函数
    return () => {
      const index = messageHandlers.value.indexOf(handler)
      if (index > -1) {
        messageHandlers.value.splice(index, 1)
      }
    }
  }
  
  // 心跳机制
  const startHeartbeat = () => {
    stopHeartbeat()
    
    heartbeatTimer.value = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        send({ type: 'ping' })
      }
    }, 30000) // 30秒一次心跳
  }
  
  const stopHeartbeat = () => {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
    }
  }
  
  // 重连机制
  const scheduleReconnect = (path, options) => {
    if (reconnectTimer.value) return
    
    let retryCount = 0
    const maxRetries = options.maxRetries || 5
    const retryDelay = options.retryDelay || 3000
    
    const attemptReconnect = () => {
      if (retryCount >= maxRetries) {
        ElMessage.error('连接失败，请刷新页面重试')
        return
      }
      
      retryCount++
      console.log(`Reconnecting... (${retryCount}/${maxRetries})`)
      
      connect(path, {
        ...options,
        onClose: (event) => {
          if (event.code !== 1000 && event.code !== 1001 && retryCount < maxRetries) {
            reconnectTimer.value = setTimeout(attemptReconnect, retryDelay)
          }
          
          if (options.onClose) {
            options.onClose(event)
          }
        }
      })
    }
    
    reconnectTimer.value = setTimeout(attemptReconnect, retryDelay)
  }
  
  // 组件卸载时清理
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    isConnected,
    connect,
    disconnect,
    send,
    onMessage
  }
}