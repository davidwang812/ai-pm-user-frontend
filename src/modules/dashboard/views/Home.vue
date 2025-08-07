<template>
  <div class="dashboard-container">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        {{ greeting }}，{{ userStore.user?.username || '用户' }}！
      </h1>
      <p class="welcome-subtitle">
        开始使用AI产品经理，快速生成高质量的PRD文档
      </p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.tokensRemaining.toLocaleString() }}</div>
              <div class="stat-label">剩余Token</div>
              <div class="stat-extra">
                共 {{ stats.tokensLimit.toLocaleString() }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.productsCount }}</div>
              <div class="stat-label">产品总数</div>
              <div class="stat-extra">
                限制 {{ stats.productsLimit }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completedCount }}</div>
              <div class="stat-label">已完成PRD</div>
              <div class="stat-extra">
                完成率 {{ completionRate }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayTokens.toLocaleString() }}</div>
              <div class="stat-label">今日使用</div>
              <div class="stat-extra">
                较昨日 {{ stats.tokensTrend > 0 ? '+' : '' }}{{ stats.tokensTrend }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card class="action-card">
      <template #header>
        <div class="card-header">
          <span class="title">快速开始</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="action-item" @click="createProduct">
            <div class="action-icon">
              <el-icon><Plus /></el-icon>
            </div>
            <h3>创建新产品</h3>
            <p>开始一个新的PRD项目</p>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <div class="action-item" @click="viewProducts">
            <div class="action-icon">
              <el-icon><Document /></el-icon>
            </div>
            <h3>我的产品</h3>
            <p>查看和管理所有产品</p>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <div class="action-item" @click="upgradeSubscription">
            <div class="action-icon">
              <el-icon><CreditCard /></el-icon>
            </div>
            <h3>升级套餐</h3>
            <p>获取更多Token和功能</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 最近产品 -->
    <el-card class="recent-card" v-if="recentProducts.length > 0">
      <template #header>
        <div class="card-header">
          <span class="title">最近产品</span>
          <el-button text @click="viewProducts">查看全部</el-button>
        </div>
      </template>
      
      <div class="recent-products">
        <div
          v-for="product in recentProducts"
          :key="product.id"
          class="product-item"
          @click="openProduct(product)"
        >
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-meta">
              <span>更新于 {{ formatDate(product.updatedAt) }}</span>
              <span class="separator">·</span>
              <span>完整度 {{ product.completeness }}%</span>
            </p>
          </div>
          <div class="product-progress">
            <el-progress
              :percentage="product.completeness"
              :stroke-width="6"
              :color="getProgressColor(product.completeness)"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-card v-else class="empty-card">
      <el-empty description="还没有创建任何产品">
        <el-button type="primary" @click="createProduct">
          创建第一个产品
        </el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Tickets,
  FolderOpened,
  CircleCheckFilled,
  TrendCharts,
  Plus,
  Document,
  CreditCard
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'
import { productAPI } from '@/services/api/product'
import { usageAPI } from '@/services/api/usage'
import dayjs from 'dayjs'

// 路由和状态
const router = useRouter()
const userStore = useAuthStore()

// 数据状态
const stats = ref({
  tokensRemaining: 0,
  tokensLimit: 100,
  productsCount: 0,
  productsLimit: 3,
  completedCount: 0,
  todayTokens: 0,
  tokensTrend: 0
})

const recentProducts = ref([])
const loading = ref(false)

// 计算属性
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const completionRate = computed(() => {
  if (stats.value.productsCount === 0) return 0
  return Math.round((stats.value.completedCount / stats.value.productsCount) * 100)
})

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 格式化日期
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('MM月DD日 HH:mm')
}

// 加载数据
const loadDashboardData = async () => {
  loading.value = true
  
  try {
    // 分别请求数据，容错处理
    try {
      const statsRes = await usageAPI.getOverview()
      if (statsRes.success) {
        const { currentPeriod, todayUsage } = statsRes.data
        stats.value = {
          tokensRemaining: currentPeriod.tokensLimit - currentPeriod.tokensUsed,
          tokensLimit: currentPeriod.tokensLimit,
          productsCount: currentPeriod.productsCreated,
          productsLimit: userStore.user?.subscription?.maxProducts || 3,
          completedCount: statsRes.data.completedCount || 0,
          todayTokens: todayUsage.tokens,
          tokensTrend: statsRes.data.tokensTrend || 0
        }
      }
    } catch (error) {
      // 如果API未实现，使用默认数据
      stats.value = {
        tokensRemaining: 100,
        tokensLimit: 100,
        productsCount: 0,
        productsLimit: 3,
        completedCount: 0,
        todayTokens: 0,
        tokensTrend: 0
      }
    }
    
    try {
      const productsRes = await productAPI.getList({ page: 1, pageSize: 5, sortBy: 'updatedAt', order: 'desc' })
      if (productsRes.success) {
        recentProducts.value = productsRes.data.products
      }
    } catch (error) {
      // 产品列表加载失败，显示空状态
      recentProducts.value = []
    }
  } catch (error) {
    // 静默处理错误，使用默认数据让用户可以正常使用
  } finally {
    loading.value = false
  }
}

// 创建产品
const createProduct = () => {
  if (stats.value.productsCount >= stats.value.productsLimit) {
    ElMessage.warning(`当前套餐最多创建 ${stats.value.productsLimit} 个产品`)
    return
  }
  router.push('/products/create')
}

// 查看产品列表
const viewProducts = () => {
  router.push('/products')
}

// 打开产品
const openProduct = (product) => {
  router.push(`/products/${product.id}/chat`)
}

// 升级订阅
const upgradeSubscription = () => {
  router.push('/subscription')
}

// 初始化
onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 30px;
  
  .welcome-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-card__body) {
    height: 100%;
    padding: 20px;
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    height: 100%;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    flex-shrink: 0;
    
    .el-icon {
      font-size: 28px;
      color: white;
    }
  }
  
  .stat-info {
    flex: 1;
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    
    .stat-extra {
      font-size: 12px;
      color: var(--text-placeholder);
      margin-top: 2px;
    }
  }
}

.action-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .action-item {
    text-align: center;
    padding: 30px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f5f7fa;
      transform: translateY(-2px);
      
      .action-icon {
        transform: scale(1.1);
      }
    }
    
    .action-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      
      .el-icon {
        font-size: 32px;
        color: white;
      }
    }
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }
    
    p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}

.recent-card {
  .recent-products {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .product-item {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
    }
    
    .product-info {
      margin-bottom: 12px;
      
      .product-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 4px;
      }
      
      .product-meta {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
        
        .separator {
          margin: 0 8px;
          color: var(--text-placeholder);
        }
      }
    }
  }
}

.empty-card {
  text-align: center;
  padding: 60px 20px;
}

// 响应式设计
@media (max-width: 768px) {
  .welcome-section {
    .welcome-title {
      font-size: 24px;
    }
    
    .welcome-subtitle {
      font-size: 14px;
    }
  }
  
  .stat-card {
    margin-bottom: 12px;
  }
  
  .action-item {
    margin-bottom: 12px;
  }
}
</style>