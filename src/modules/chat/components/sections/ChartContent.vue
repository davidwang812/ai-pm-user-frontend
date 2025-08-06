<template>
  <div class="chart-content">
    <div ref="chartRef" class="chart-container"></div>
    
    <!-- 图表说明 -->
    <div v-if="metadata.description" class="chart-description">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ metadata.description }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { InfoFilled } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  content: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.type && value.data
    }
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// Refs
const chartRef = ref(null)
let chartInstance = null

// 获取图表配置
const getChartOption = () => {
  const { type, data } = props.content
  const baseOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    }
  }
  
  switch (type) {
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.categories
        },
        yAxis: {
          type: 'value'
        },
        series: data.series.map(item => ({
          name: item.name,
          type: 'line',
          smooth: true,
          data: item.data
        }))
      }
      
    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.categories
        },
        yAxis: {
          type: 'value'
        },
        series: data.series.map(item => ({
          name: item.name,
          type: 'bar',
          data: item.data
        }))
      }
      
    case 'pie':
      return {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          name: data.name || '数据',
          type: 'pie',
          radius: '50%',
          data: data.items,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      
    case 'radar':
      return {
        tooltip: {},
        legend: {
          bottom: 0
        },
        radar: {
          indicator: data.categories.map(cat => ({ name: cat }))
        },
        series: [{
          type: 'radar',
          data: data.series.map(item => ({
            name: item.name,
            value: item.data
          }))
        }]
      }
      
    default:
      return baseOption
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁旧实例
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(getChartOption())
}

// 调整图表大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 生命周期
onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
  }
})

// 监听数据变化
watch(() => props.content, () => {
  initChart()
}, { deep: true })
</script>

<style lang="scss" scoped>
.chart-content {
  .chart-container {
    width: 100%;
    height: 400px;
    min-height: 300px;
  }
  
  .chart-description {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    color: #909399;
    font-size: 14px;
    
    .el-icon {
      font-size: 16px;
      color: #409eff;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chart-content {
    .chart-container {
      height: 300px;
      min-height: 250px;
    }
  }
}
</style>