<template>
  <div class="usage-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">使用统计</h1>
      <p class="page-subtitle">查看您的Token使用情况和消费记录</p>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon blue">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">本月Token使用</p>
              <h3 class="stat-value">{{ formatNumber(monthlyStats.tokens) }}</h3>
              <p class="stat-change">
                限额 {{ formatNumber(monthlyStats.limit) }}
              </p>
            </div>
          </div>
          <el-progress
            :percentage="monthlyTokenPercent"
            :color="getProgressColor(monthlyTokenPercent)"
            :show-text="false"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon green">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">本月消费</p>
              <h3 class="stat-value">¥{{ monthlyStats.cost.toFixed(2) }}</h3>
              <p class="stat-change">
                {{ monthlyStats.apiCalls }} 次调用
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon orange">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">日均使用</p>
              <h3 class="stat-value">{{ formatNumber(dailyAverage) }}</h3>
              <p class="stat-change">
                Token/天
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon purple">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">剩余额度</p>
              <h3 class="stat-value">{{ remainingPercent }}%</h3>
              <p class="stat-change">
                {{ formatNumber(remainingTokens) }} Token
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 使用趋势图 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>使用趋势</h3>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="7">7天</el-radio-button>
                <el-radio-button label="30">30天</el-radio-button>
                <el-radio-button label="90">90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <!-- 服务使用分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <h3>服务使用分布</h3>
          </template>
          <div ref="serviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 产品使用统计 -->
    <el-card class="product-usage-card">
      <template #header>
        <div class="card-header">
          <h3>产品使用统计</h3>
          <el-button text @click="loadProductUsage">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table
        :data="productUsage"
        style="width: 100%"
        v-loading="productLoading"
      >
        <el-table-column prop="product_name" label="产品名称" min-width="200" />
        <el-table-column label="API调用次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.api_calls || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="Token使用量" width="150" align="center">
          <template #default="{ row }">
            {{ formatNumber(row.total_tokens || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="消费金额" width="120" align="center">
          <template #default="{ row }">
            ¥{{ (row.total_cost || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="使用占比" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="getUsagePercent(row.total_tokens)"
              :stroke-width="6"
              :color="getProgressColor(getUsagePercent(row.total_tokens))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="viewProductDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 使用历史 -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <h3>使用历史</h3>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              @change="loadHistory"
            />
            <el-select
              v-model="serviceFilter"
              placeholder="服务类型"
              size="small"
              clearable
              @change="loadHistory"
            >
              <el-option label="提问AI" value="question" />
              <el-option label="辅助AI" value="assist" />
              <el-option label="绘图AI" value="draw" />
            </el-select>
          </div>
        </div>
      </template>
      
      <el-table
        :data="usageHistory"
        style="width: 100%"
        v-loading="historyLoading"
      >
        <el-table-column prop="started_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.started_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="ai_service_type" label="服务类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getServiceTagType(row.ai_service_type)" size="small">
              {{ getServiceName(row.ai_service_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Token使用" width="150">
          <template #default="{ row }">
            <div class="token-detail">
              <span>输入: {{ row.input_tokens }}</span>
              <span>输出: {{ row.output_tokens }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_tokens" label="总计" width="100" align="center">
          <template #default="{ row }">
            {{ row.total_tokens }}
          </template>
        </el-table-column>
        <el-table-column prop="cost_amount" label="费用" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.cost_amount.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.status === 'success'" color="#67c23a">
              <CircleCheck />
            </el-icon>
            <el-icon v-else color="#f56c6c">
              <CircleClose />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="table-footer">
        <el-button
          v-if="hasMoreHistory"
          @click="loadMoreHistory"
          :loading="historyLoading"
        >
          加载更多
        </el-button>
      </div>
    </el-card>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportVisible"
      title="导出使用报告"
      width="500px"
    >
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出时段">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="excel">Excel</el-radio>
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="pdf">PDF</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含内容">
          <el-checkbox-group v-model="exportForm.content">
            <el-checkbox label="summary">统计摘要</el-checkbox>
            <el-checkbox label="detail">详细记录</el-checkbox>
            <el-checkbox label="chart">图表数据</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport" :loading="exporting">
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Coin,
  Money,
  TrendCharts,
  PieChart,
  Refresh,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { usageAPI } from '@/services/api/usage'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// 状态
const monthlyStats = ref({
  tokens: 0,
  cost: 0,
  apiCalls: 0,
  limit: 1000000
})

const dailyUsage = ref([])
const productUsage = ref([])
const usageHistory = ref([])
const serviceUsage = ref({})

// 控制状态
const trendPeriod = ref(30)
const dateRange = ref(null)
const serviceFilter = ref('')
const productLoading = ref(false)
const historyLoading = ref(false)
const hasMoreHistory = ref(true)
const historyLimit = ref(20)

// 导出相关
const exportVisible = ref(false)
const exporting = ref(false)
const exportForm = ref({
  dateRange: null,
  format: 'excel',
  content: ['summary', 'detail']
})

// 图表引用
const trendChartRef = ref(null)
const serviceChartRef = ref(null)
let trendChart = null
let serviceChart = null

// 计算属性
const monthlyTokenPercent = computed(() => {
  return Math.round((monthlyStats.value.tokens / monthlyStats.value.limit) * 100)
})

const dailyAverage = computed(() => {
  const days = new Date().getDate()
  return Math.round(monthlyStats.value.tokens / days)
})

const remainingTokens = computed(() => {
  return monthlyStats.value.limit - monthlyStats.value.tokens
})

const remainingPercent = computed(() => {
  return Math.round((remainingTokens.value / monthlyStats.value.limit) * 100)
})

// 格式化函数
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDateTime = (dateStr) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const getProgressColor = (percent) => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

const getUsagePercent = (tokens) => {
  if (!monthlyStats.value.tokens) return 0
  return Math.round((tokens / monthlyStats.value.tokens) * 100)
}

const getServiceTagType = (type) => {
  const map = {
    question: '',
    assist: 'success',
    draw: 'warning'
  }
  return map[type] || 'info'
}

const getServiceName = (type) => {
  const map = {
    question: '提问AI',
    assist: '辅助AI',
    draw: '绘图AI'
  }
  return map[type] || type
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await usageAPI.getStats()
    if (response.success) {
      const data = response.data
      monthlyStats.value = {
        tokens: data.monthly_tokens || 0,
        cost: data.monthly_cost || 0,
        apiCalls: data.api_calls || 0,
        limit: data.token_limit || 1000000
      }
      serviceUsage.value = data.service_usage || {}
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载每日使用数据
const loadDailyUsage = async () => {
  try {
    const response = await usageAPI.getDailyUsage({ days: trendPeriod.value })
    if (response.success) {
      dailyUsage.value = response.data.daily_usage || []
      updateTrendChart()
    }
  } catch (error) {
    console.error('加载每日使用数据失败:', error)
  }
}

// 加载产品使用统计
const loadProductUsage = async () => {
  productLoading.value = true
  try {
    const response = await usageAPI.getProductUsage()
    if (response.success) {
      productUsage.value = response.data.product_usage || []
    }
  } catch (error) {
    console.error('加载产品使用统计失败:', error)
  } finally {
    productLoading.value = false
  }
}

// 加载使用历史
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const params = {
      limit: historyLimit.value
    }
    
    if (dateRange.value) {
      params.start_date = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    
    if (serviceFilter.value) {
      params.service_type = serviceFilter.value
    }
    
    const response = await usageAPI.getHistory(params)
    if (response.success) {
      usageHistory.value = response.data.history || []
      hasMoreHistory.value = response.data.history.length === historyLimit.value
    }
  } catch (error) {
    console.error('加载使用历史失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 加载更多历史
const loadMoreHistory = async () => {
  historyLimit.value += 20
  await loadHistory()
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['Token使用', 'API调用', '费用']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: [
      {
        type: 'value',
        name: 'Token数',
        position: 'left'
      },
      {
        type: 'value',
        name: '费用(¥)',
        position: 'right'
      }
    ],
    series: [
      {
        name: 'Token使用',
        type: 'bar',
        data: [],
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '费用',
        type: 'line',
        yAxisIndex: 1,
        data: [],
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart || !dailyUsage.value.length) return
  
  const dates = dailyUsage.value.map(item => 
    dayjs(item.usage_date).format('MM-DD')
  )
  const tokens = dailyUsage.value.map(item => item.total_tokens)
  const costs = dailyUsage.value.map(item => item.total_cost)
  
  trendChart.setOption({
    xAxis: { data: dates },
    series: [
      { data: tokens },
      { data: costs }
    ]
  })
}

// 初始化服务分布图
const initServiceChart = () => {
  if (!serviceChartRef.value) return
  
  serviceChart = echarts.init(serviceChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '服务使用',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }]
  }
  
  serviceChart.setOption(option)
  updateServiceChart()
}

// 更新服务分布图
const updateServiceChart = () => {
  if (!serviceChart) return
  
  const data = Object.entries(serviceUsage.value).map(([key, value]) => ({
    name: getServiceName(key),
    value: value
  }))
  
  serviceChart.setOption({
    series: [{ data }]
  })
}

// 查看产品详情
const viewProductDetail = (product) => {
  // TODO: 跳转到产品详情页面
  console.log('View product detail:', product)
}

// 导出报告
const handleExport = async () => {
  if (!exportForm.value.dateRange) {
    ElMessage.warning('请选择导出时段')
    return
  }
  
  exporting.value = true
  
  try {
    const response = await usageAPI.exportReport({
      start_date: dayjs(exportForm.value.dateRange[0]).format('YYYY-MM-DD'),
      end_date: dayjs(exportForm.value.dateRange[1]).format('YYYY-MM-DD'),
      format: exportForm.value.format,
      content: exportForm.value.content
    })
    
    // 下载文件
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage_report_${dayjs().format('YYYYMMDD')}.${exportForm.value.format}`
    a.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报告导出成功')
    exportVisible.value = false
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 监听窗口大小变化
const handleResize = () => {
  trendChart?.resize()
  serviceChart?.resize()
}

// 生命周期
onMounted(async () => {
  await loadStats()
  await loadDailyUsage()
  await loadProductUsage()
  await loadHistory()
  
  // 初始化图表
  initTrendChart()
  initServiceChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 销毁图表
  trendChart?.dispose()
  serviceChart?.dispose()
  
  // 移除监听器
  window.removeEventListener('resize', handleResize)
})

// 监听周期变化
import { watch } from 'vue'
watch(trendPeriod, () => {
  loadDailyUsage()
})
</script>

<style lang="scss" scoped>
.usage-container {
  max-width: 1400px;
  margin: 0 auto;
}

// 页面头部
.page-header {
  margin-bottom: 32px;
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  
  .page-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }
}

// 统计概览
.stats-overview {
  margin-bottom: 24px;
  
  .stat-card {
    height: 100%;
    
    :deep(.el-card__body) {
      padding: 20px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        .el-icon {
          font-size: 24px;
          color: white;
        }
        
        &.blue {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }
        
        &.green {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
        
        &.orange {
          background: linear-gradient(135deg, #e6a23c, #f0b86e);
        }
        
        &.purple {
          background: linear-gradient(135deg, #909399, #a6a9ad);
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 4px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 4px;
        }
        
        .stat-change {
          font-size: 12px;
          color: var(--text-placeholder);
          margin: 0;
        }
      }
    }
  }
}

// 图表区域
.charts-section {
  margin-bottom: 24px;
  
  .chart-card {
    height: 400px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
      }
    }
    
    .chart-container {
      height: 320px;
    }
  }
}

// 产品使用卡片
.product-usage-card {
  margin-bottom: 24px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
    }
  }
}

// 历史记录卡片
.history-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    
    h3 {
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
  
  .token-detail {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .table-footer {
    text-align: center;
    padding: 16px 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    .page-title {
      font-size: 24px;
    }
  }
  
  .stat-card {
    margin-bottom: 16px;
  }
  
  .chart-card {
    margin-bottom: 16px;
  }
  
  .history-card {
    .card-header {
      .header-actions {
        width: 100%;
        
        > * {
          flex: 1;
        }
      }
    }
  }
}
</style>