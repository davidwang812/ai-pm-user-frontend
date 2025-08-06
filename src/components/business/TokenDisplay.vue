<template>
  <div class="token-display" @click="showDetails">
    <el-tooltip
      :content="`Token余额: ${formattedRemaining} / ${formattedTotal}`"
      placement="bottom"
    >
      <div class="token-content">
        <el-icon class="token-icon"><Ticket /></el-icon>
        <span class="token-value">{{ formattedRemaining }}</span>
        <el-progress
          :percentage="percentage"
          :show-text="false"
          :stroke-width="4"
          :color="progressColor"
          class="token-progress"
        />
      </div>
    </el-tooltip>
  </div>
  
  <!-- Token详情对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="Token使用详情"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="token-details">
      <!-- 当前余额 -->
      <div class="detail-section">
        <h4>当前余额</h4>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">剩余Token:</span>
            <span class="value primary">{{ formattedRemaining }}</span>
          </div>
          <div class="detail-item">
            <span class="label">总额度:</span>
            <span class="value">{{ formattedTotal }}</span>
          </div>
          <div class="detail-item">
            <span class="label">已使用:</span>
            <span class="value">{{ formattedUsed }}</span>
          </div>
          <div class="detail-item">
            <span class="label">使用率:</span>
            <span class="value">{{ percentage }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 套餐信息 -->
      <div class="detail-section">
        <h4>套餐信息</h4>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">当前套餐:</span>
            <el-tag :type="subscriptionType">{{ subscriptionText }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="label">到期时间:</span>
            <span class="value">{{ expiryDate }}</span>
          </div>
        </div>
      </div>
      
      <!-- 使用预警 -->
      <el-alert
        v-if="percentage > 80"
        :title="warningMessage"
        type="warning"
        :closable="false"
        show-icon
        class="usage-warning"
      />
      
      <!-- 今日使用 -->
      <div class="detail-section">
        <h4>今日使用</h4>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">Token消耗:</span>
            <span class="value">{{ todayUsage.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <span class="label">AI调用次数:</span>
            <span class="value">{{ todayCalls }} 次</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="goToUpgrade">
        升级套餐
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { usageAPI } from '@/services/api/usage'
import dayjs from 'dayjs'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()

// 数据状态
const dialogVisible = ref(false)
const tokensRemaining = ref(0)
const tokensTotal = ref(100)
const todayUsage = ref(0)
const todayCalls = ref(0)
const refreshTimer = ref(null)

// 计算属性
const tokensUsed = computed(() => {
  return tokensTotal.value - tokensRemaining.value
})

const percentage = computed(() => {
  if (tokensTotal.value === 0) return 0
  const used = (tokensUsed.value / tokensTotal.value) * 100
  return Math.min(Math.round(used), 100)
})

const progressColor = computed(() => {
  const p = percentage.value
  if (p < 50) return '#67c23a'
  if (p < 80) return '#e6a23c'
  return '#f56c6c'
})

const formattedRemaining = computed(() => {
  return tokensRemaining.value.toLocaleString()
})

const formattedTotal = computed(() => {
  return tokensTotal.value.toLocaleString()
})

const formattedUsed = computed(() => {
  return tokensUsed.value.toLocaleString()
})

const subscriptionText = computed(() => {
  const plan = authStore.user?.subscription?.plan
  const planMap = {
    free: '免费版',
    basic: '基础版',
    professional: '专业版'
  }
  return planMap[plan] || '免费版'
})

const subscriptionType = computed(() => {
  const plan = authStore.user?.subscription?.plan
  const typeMap = {
    free: 'info',
    basic: 'warning',
    professional: 'success'
  }
  return typeMap[plan] || 'info'
})

const expiryDate = computed(() => {
  const date = authStore.user?.subscription?.expiresAt
  if (!date) return '无限期'
  return dayjs(date).format('YYYY年MM月DD日')
})

const warningMessage = computed(() => {
  const p = percentage.value
  if (p >= 95) return 'Token即将用完，请尽快充值或升级套餐'
  if (p >= 80) return 'Token余额不足20%，建议及时充值'
  return ''
})

// 加载Token数据
const loadTokenData = async () => {
  try {
    const response = await usageAPI.getCurrentUsage()
    if (response.success) {
      const { currentPeriod, todayUsage: today } = response.data
      tokensRemaining.value = currentPeriod.tokensLimit - currentPeriod.tokensUsed
      tokensTotal.value = currentPeriod.tokensLimit
      todayUsage.value = today.tokens
      todayCalls.value = today.aiCalls
    }
  } catch (error) {
    console.error('加载Token数据失败:', error)
  }
}

// 显示详情
const showDetails = () => {
  dialogVisible.value = true
  loadTokenData() // 刷新数据
}

// 跳转升级
const goToUpgrade = () => {
  dialogVisible.value = false
  router.push('/subscription')
}

// 定时刷新Token数据
const startRefreshTimer = () => {
  refreshTimer.value = setInterval(() => {
    loadTokenData()
  }, 30000) // 30秒刷新一次
}

// 停止刷新
const stopRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 初始化
onMounted(() => {
  // 从用户信息获取初始数据
  const subscription = authStore.user?.subscription
  if (subscription) {
    tokensRemaining.value = subscription.tokensRemaining || 0
    tokensTotal.value = subscription.tokensLimit || 100
  }
  
  // 加载最新数据
  loadTokenData()
  
  // 启动定时刷新
  startRefreshTimer()
})

// 清理
onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<style lang="scss" scoped>
.token-display {
  cursor: pointer;
  
  .token-content {
    display: flex;
    align-items: center;
    padding: 6px 16px;
    background-color: #f0f2f5;
    border-radius: 20px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #e6e8eb;
      transform: translateY(-1px);
    }
    
    .token-icon {
      font-size: 16px;
      color: var(--primary-color);
      margin-right: 6px;
    }
    
    .token-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-right: 8px;
      min-width: 60px;
    }
    
    .token-progress {
      width: 60px;
    }
  }
}

// 详情对话框
.token-details {
  .detail-section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 12px;
    }
  }
  
  .detail-content {
    background-color: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      
      &.primary {
        font-size: 18px;
        color: var(--primary-color);
      }
    }
  }
  
  .usage-warning {
    margin-bottom: 24px;
  }
}

// 进度条样式覆盖
:deep(.el-progress) {
  .el-progress-bar {
    width: 100%;
  }
  
  .el-progress-bar__outer {
    background-color: #e0e0e0;
  }
  
  .el-progress-bar__inner {
    transition: width 0.6s ease;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .token-display {
    .token-content {
      padding: 4px 12px;
      
      .token-value {
        min-width: auto;
        font-size: 13px;
      }
      
      .token-progress {
        display: none;
      }
    }
  }
}
</style>