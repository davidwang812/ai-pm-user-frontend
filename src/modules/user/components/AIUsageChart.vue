<template>
  <div class="ai-usage-chart" ref="chartRef"></div>
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

// AI颜色映射
const aiColors = {
  '提问AI': '#409eff',
  '助理AI': '#67c23a',
  '评分AI': '#e6a23c',
  '绘图AI': '#f56c6c'
}

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
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      data: props.data.map(item => item.name),
      textStyle: {
        color: isDark.value ? '#8b92a1' : '#606266'
      }
    },
    series: [
      {
        name: 'AI使用分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: isDark.value ? '#2e3440' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.map(item => ({
          ...item,
          itemStyle: {
            color: aiColors[item.name] || '#909399'
          }
        }))
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
    series: [
      {
        data: props.data.map(item => ({
          ...item,
          itemStyle: {
            color: aiColors[item.name] || '#909399'
          }
        }))
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
.ai-usage-chart {
  width: 100%;
  height: v-bind(height + 'px');
}
</style>