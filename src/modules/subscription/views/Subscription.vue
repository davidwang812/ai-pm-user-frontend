<template>
  <div class="subscription-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">订阅管理</h1>
      <p class="page-subtitle">选择适合您的套餐，解锁更多功能</p>
    </div>

    <!-- 当前套餐信息 -->
    <el-card class="current-plan-card" v-if="currentPlan">
      <div class="current-plan-header">
        <div class="plan-info">
          <h3>当前套餐</h3>
          <div class="plan-name">
            <el-icon :style="{ color: currentPlan.color }">
              <component :is="currentPlan.icon" />
            </el-icon>
            <span>{{ currentPlan.name }}</span>
            <el-tag v-if="currentPlan.trial" type="warning" size="small">
              试用中
            </el-tag>
          </div>
        </div>
        <div class="plan-expire">
          <span class="label">到期时间</span>
          <span class="value">{{ formatDate(currentPlan.expireAt) }}</span>
          <el-tag
            v-if="daysRemaining <= 7"
            type="danger"
            size="small"
            effect="dark"
          >
            即将到期
          </el-tag>
        </div>
      </div>
      
      <!-- 使用情况 -->
      <div class="usage-stats">
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">今日Token使用</span>
            <span class="stat-value">
              {{ formatNumber(currentUsage.dailyTokens) }} / 
              {{ formatNumber(currentPlan.dailyTokens) }}
            </span>
          </div>
          <el-progress
            :percentage="dailyTokenPercent"
            :color="getProgressColor(dailyTokenPercent)"
          />
        </div>
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">产品数量</span>
            <span class="stat-value">
              {{ currentUsage.products }} / {{ currentPlan.maxProducts }}
            </span>
          </div>
          <el-progress
            :percentage="productPercent"
            :color="getProgressColor(productPercent)"
          />
        </div>
      </div>
    </el-card>

    <!-- 套餐列表 -->
    <div class="plans-grid">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{
          recommended: plan.recommended,
          current: plan.id === currentPlan?.id
        }"
      >
        <!-- 推荐标签 -->
        <div v-if="plan.recommended" class="recommended-badge">
          <el-icon><Star /></el-icon>
          最受欢迎
        </div>

        <!-- 套餐头部 -->
        <div class="plan-header">
          <el-icon :size="48" :style="{ color: plan.color }">
            <component :is="plan.icon" />
          </el-icon>
          <h3 class="plan-name">{{ plan.name }}</h3>
          <p class="plan-desc">{{ plan.description }}</p>
        </div>

        <!-- 价格 -->
        <div class="plan-price">
          <span class="price-currency">¥</span>
          <span class="price-value">{{ plan.price }}</span>
          <span class="price-unit">/月</span>
        </div>

        <!-- 功能列表 -->
        <ul class="feature-list">
          <li v-for="(feature, index) in plan.features" :key="index">
            <el-icon class="feature-icon"><CircleCheck /></el-icon>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <!-- 额度信息 -->
        <div class="quota-info">
          <div class="quota-item">
            <span class="quota-label">每日Token额度</span>
            <span class="quota-value">{{ formatNumber(plan.dailyTokens) }}</span>
          </div>
          <div class="quota-item">
            <span class="quota-label">产品数量上限</span>
            <span class="quota-value">{{ plan.maxProducts }}个</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="plan-actions">
          <el-button
            v-if="plan.id === currentPlan?.id"
            size="large"
            disabled
            style="width: 100%"
          >
            当前套餐
          </el-button>
          <el-button
            v-else-if="plan.price === 0"
            size="large"
            @click="switchPlan(plan)"
            style="width: 100%"
          >
            切换到免费版
          </el-button>
          <el-button
            v-else
            type="primary"
            size="large"
            @click="upgradePlan(plan)"
            style="width: 100%"
          >
            {{ plan.id > currentPlan?.id ? '升级' : '更换' }}套餐
          </el-button>
        </div>
      </div>
    </div>

    <!-- 功能对比 -->
    <el-card class="comparison-card">
      <template #header>
        <div class="card-header">
          <h3>功能对比</h3>
          <el-button text @click="showFullComparison = !showFullComparison">
            {{ showFullComparison ? '收起' : '展开' }}详细对比
            <el-icon class="el-icon--right">
              <component :is="showFullComparison ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </el-button>
        </div>
      </template>
      
      <el-table :data="comparisonData" style="width: 100%">
        <el-table-column prop="feature" label="功能" width="200" />
        <el-table-column
          v-for="plan in plans"
          :key="plan.id"
          :label="plan.name"
          align="center"
        >
          <template #default="{ row }">
            <el-icon
              v-if="row[plan.id] === true"
              color="#67c23a"
              :size="20"
            >
              <CircleCheck />
            </el-icon>
            <el-icon
              v-else-if="row[plan.id] === false"
              color="#f56c6c"
              :size="20"
            >
              <CircleClose />
            </el-icon>
            <span v-else>{{ row[plan.id] }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 常见问题 -->
    <el-card class="faq-card">
      <template #header>
        <h3>常见问题</h3>
      </template>
      
      <el-collapse v-model="activeFAQ">
        <el-collapse-item
          v-for="(faq, index) in faqs"
          :key="index"
          :title="faq.question"
          :name="index"
        >
          <p>{{ faq.answer }}</p>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 支付对话框 -->
    <el-dialog
      v-model="paymentVisible"
      title="确认支付"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="payment-content">
        <div class="payment-info">
          <h4>套餐信息</h4>
          <div class="info-item">
            <span class="label">套餐名称：</span>
            <span class="value">{{ selectedPlan?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">订阅周期：</span>
            <span class="value">1个月</span>
          </div>
          <div class="info-item">
            <span class="label">应付金额：</span>
            <span class="value price">¥{{ selectedPlan?.price }}</span>
          </div>
        </div>

        <div class="payment-method">
          <h4>支付方式</h4>
          <el-radio-group v-model="paymentMethod">
            <el-radio label="alipay" border>
              <div class="payment-option">
                <img src="@/assets/images/alipay.png" alt="支付宝" />
                <span>支付宝</span>
              </div>
            </el-radio>
            <el-radio label="wechat" border>
              <div class="payment-option">
                <img src="@/assets/images/wechat-pay.png" alt="微信支付" />
                <span>微信支付</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="paymentVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="paying"
          @click="confirmPayment"
        >
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  CircleCheck,
  CircleClose,
  ArrowUp,
  ArrowDown,
  User,
  Promotion,
  Trophy
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { subscriptionAPI } from '@/services/api/subscription'
import dayjs from 'dayjs'

// 状态管理
const authStore = useAuthStore()

// 套餐列表
const plans = [
  {
    id: 1,
    name: '免费版',
    description: '适合个人学习和体验',
    price: 0,
    color: '#909399',
    icon: User,
    dailyTokens: 10000,
    maxProducts: 3,
    features: [
      '每日10,000 Token额度',
      '最多创建3个产品',
      '基础AI功能',
      '社区支持'
    ]
  },
  {
    id: 2,
    name: '专业版',
    description: '适合个人开发者和小团队',
    price: 29,
    color: '#409eff',
    icon: Promotion,
    recommended: true,
    dailyTokens: 100000,
    maxProducts: 20,
    features: [
      '每日100,000 Token额度',
      '最多创建20个产品',
      '完整AI功能',
      '优先技术支持',
      'PRD导出功能',
      '协作功能'
    ]
  },
  {
    id: 3,
    name: '企业版',
    description: '适合企业和专业团队',
    price: 99,
    color: '#e6a23c',
    icon: Trophy,
    dailyTokens: 500000,
    maxProducts: 100,
    features: [
      '每日500,000 Token额度',
      '最多创建100个产品',
      '高级AI功能',
      '专属客户经理',
      '定制化功能',
      '团队协作',
      'API接口',
      '数据导出'
    ]
  }
]

// 当前套餐
const currentPlan = ref(null)
const currentUsage = ref({
  dailyTokens: 0,
  products: 0
})

// 支付相关
const paymentVisible = ref(false)
const selectedPlan = ref(null)
const paymentMethod = ref('alipay')
const paying = ref(false)

// 功能对比
const showFullComparison = ref(false)
const comparisonData = [
  {
    feature: '每日Token额度',
    1: '10,000',
    2: '100,000',
    3: '500,000'
  },
  {
    feature: '产品数量上限',
    1: '3个',
    2: '20个',
    3: '100个'
  },
  {
    feature: '4AI协作系统',
    1: true,
    2: true,
    3: true
  },
  {
    feature: 'PRD导出',
    1: false,
    2: true,
    3: true
  },
  {
    feature: '团队协作',
    1: false,
    2: true,
    3: true
  },
  {
    feature: 'API接口',
    1: false,
    2: false,
    3: true
  },
  {
    feature: '技术支持',
    1: '社区',
    2: '优先',
    3: '专属'
  }
]

// FAQ
const activeFAQ = ref([0])
const faqs = [
  {
    question: 'Token是什么？如何计算？',
    answer: 'Token是AI模型处理文本的基本单位。通常1个中文字符约等于2个Token，1个英文单词约等于1个Token。每次与AI对话都会消耗Token，包括输入和输出的文本。'
  },
  {
    question: '套餐可以随时更换吗？',
    answer: '可以的。您可以随时升级到更高级的套餐，升级后立即生效。如果要降级套餐，需要等当前套餐到期后才能切换。'
  },
  {
    question: '超出Token限额会怎样？',
    answer: '当您的每日Token使用量达到限额后，系统会暂停AI服务，您可以等待第二天额度重置，或升级到更高级的套餐获得更多额度。'
  },
  {
    question: '支持哪些支付方式？',
    answer: '目前支持支付宝和微信支付。所有支付都通过安全的第三方支付平台完成，我们不会存储您的支付信息。'
  },
  {
    question: '可以开具发票吗？',
    answer: '可以的。订阅成功后，您可以在个人中心申请开具电子发票，支持普通发票和增值税专用发票。'
  }
]

// 计算属性
const daysRemaining = computed(() => {
  if (!currentPlan.value) return 0
  const days = dayjs(currentPlan.value.expireAt).diff(dayjs(), 'day')
  return Math.max(0, days)
})

const dailyTokenPercent = computed(() => {
  if (!currentPlan.value) return 0
  return Math.round((currentUsage.value.dailyTokens / currentPlan.value.dailyTokens) * 100)
})

const productPercent = computed(() => {
  if (!currentPlan.value) return 0
  return Math.round((currentUsage.value.products / currentPlan.value.maxProducts) * 100)
})

// 格式化函数
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatNumber = (num) => {
  return num.toLocaleString()
}

const getProgressColor = (percent) => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

// 加载当前套餐信息
const loadCurrentPlan = async () => {
  try {
    const response = await subscriptionAPI.getCurrentPlan()
    if (response.success) {
      const planData = response.data
      currentPlan.value = {
        ...plans.find(p => p.id === planData.planId),
        expireAt: planData.expireAt,
        trial: planData.trial
      }
      currentUsage.value = planData.usage
    }
  } catch (error) {
    console.error('加载套餐信息失败:', error)
  }
}

// 切换免费套餐
const switchPlan = async (plan) => {
  try {
    await ElMessageBox.confirm(
      '切换到免费套餐将失去部分功能，确定要切换吗？',
      '切换确认',
      {
        confirmButtonText: '确定切换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await subscriptionAPI.switchPlan(plan.id)
    if (response.success) {
      ElMessage.success('套餐切换成功')
      loadCurrentPlan()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换套餐失败:', error)
      ElMessage.error('切换套餐失败')
    }
  }
}

// 升级套餐
const upgradePlan = (plan) => {
  selectedPlan.value = plan
  paymentVisible.value = true
}

// 确认支付
const confirmPayment = async () => {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  paying.value = true

  try {
    const response = await subscriptionAPI.createOrder({
      planId: selectedPlan.value.id,
      paymentMethod: paymentMethod.value
    })

    if (response.success) {
      // 跳转到支付页面或显示支付二维码
      window.location.href = response.data.payUrl
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    ElMessage.error('创建订单失败，请重试')
  } finally {
    paying.value = false
  }
}

// 生命周期
onMounted(() => {
  loadCurrentPlan()
})
</script>

<style lang="scss" scoped>
.subscription-container {
  max-width: 1200px;
  margin: 0 auto;
}

// 页面头部
.page-header {
  text-align: center;
  margin-bottom: 40px;
  
  .page-title {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 12px;
  }
  
  .page-subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    margin: 0;
  }
}

// 当前套餐卡片
.current-plan-card {
  margin-bottom: 40px;
  
  .current-plan-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    .plan-info {
      h3 {
        font-size: 16px;
        color: var(--text-secondary);
        margin: 0 0 12px;
      }
      
      .plan-name {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: 600;
        
        .el-icon {
          font-size: 28px;
        }
      }
    }
    
    .plan-expire {
      text-align: right;
      
      .label {
        display: block;
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
      
      .value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }
    }
  }
  
  .usage-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    
    .stat-item {
      .stat-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        
        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: 600;
        }
      }
    }
  }
}

// 套餐网格
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

// 套餐卡片
.plan-card {
  position: relative;
  background-color: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 32px 24px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  &.recommended {
    border-color: #409eff;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
  }
  
  &.current {
    background-color: #f5f7fa;
  }
  
  .recommended-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 16px;
    background-color: #409eff;
    color: white;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .plan-header {
    text-align: center;
    margin-bottom: 24px;
    
    .plan-name {
      font-size: 24px;
      font-weight: 600;
      margin: 16px 0 8px;
    }
    
    .plan-desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
  
  .plan-price {
    text-align: center;
    margin-bottom: 32px;
    
    .price-currency {
      font-size: 20px;
      color: var(--text-secondary);
      vertical-align: top;
    }
    
    .price-value {
      font-size: 48px;
      font-weight: 600;
      color: #303133;
    }
    
    .price-unit {
      font-size: 16px;
      color: var(--text-secondary);
    }
  }
  
  .feature-list {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    
    li {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      
      .feature-icon {
        color: #67c23a;
        flex-shrink: 0;
      }
    }
  }
  
  .quota-info {
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 24px;
    
    .quota-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .quota-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
      
      .quota-value {
        font-size: 14px;
        font-weight: 600;
      }
    }
  }
}

// 功能对比卡片
.comparison-card {
  margin-bottom: 40px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
    }
  }
}

// FAQ卡片
.faq-card {
  h3 {
    margin: 0;
  }
  
  :deep(.el-collapse-item__header) {
    font-size: 16px;
    font-weight: 500;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

// 支付内容
.payment-content {
  .payment-info {
    margin-bottom: 24px;
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
      
      .label {
        color: var(--text-secondary);
      }
      
      .value {
        font-weight: 500;
        
        &.price {
          font-size: 20px;
          color: #f56c6c;
        }
      }
    }
  }
  
  .payment-method {
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
    }
    
    :deep(.el-radio-group) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .el-radio {
        margin: 0;
        height: 60px;
        
        .el-radio__label {
          width: 100%;
        }
      }
    }
    
    .payment-option {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      img {
        height: 24px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    .page-title {
      font-size: 24px;
    }
    
    .page-subtitle {
      font-size: 16px;
    }
  }
  
  .current-plan-card {
    .current-plan-header {
      flex-direction: column;
      gap: 20px;
      
      .plan-expire {
        text-align: left;
      }
    }
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-card {
    :deep(.el-table) {
      font-size: 12px;
    }
  }
}
</style>