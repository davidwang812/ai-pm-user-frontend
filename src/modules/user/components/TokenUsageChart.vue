<template>
  <div class="token-usage-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme'

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  type: {
    type: String,
    default: 'daily'
  },
  height: {
    type: Number,
    default: 300
  }
})

// 图表引用
const chartRef = ref(null)
let chartInstance = null

// 主题
const { isDark } = useTheme()

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁旧实例
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartRef.value, isDark.value ? 'dark' : null)
  
  // 配置选项
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>Token使用量: ${data.value.toLocaleString()}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map(item => item.date),
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#4c566a' : '#dcdfe6'
        }
      },
      axisLabel: {
        color: isDark.value ? '#8b92a1' : '#606266'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#4c566a' : '#dcdfe6'
        }
      },
      axisLabel: {
        color: isDark.value ? '#8b92a1' : '#606266',
        formatter: (value) => {
          if (value >= 1000000) return (value / 1000000) + 'M'
          if (value >= 1000) return (value / 1000) + 'K'
          return value
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark.value ? '#3b4252' : '#e4e7ed'
        }
      }
    },
    series: [
      {
        name: 'Token使用量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        sampling: 'average',
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 0.8,
              color: 'rgba(64, 158, 255, 0.05)'
            }
          ])
        },
        data: props.data.map(item => item.value)
      }
    ]
  }
  
  // 设置选项
  chartInstance.setOption(option)
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return
  
  const option = {
    xAxis: {
      data: props.data.map(item => item.date)
    },
    series: [
      {
        data: props.data.map(item => item.value)
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 调整大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

// 监听主题变化
watch(isDark, () => {
  initChart()
})

// 生命周期
onMounted(() => {
  // 初始化图表
  initChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  // 销毁图表
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 移除事件监听
  window.removeEventListener('resize', resizeChart)
})
</script>

<style lang="scss" scoped>
.token-usage-chart {
  width: 100%;
  height: v-bind(height + 'px');
}
</style>