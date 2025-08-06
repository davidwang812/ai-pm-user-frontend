<template>
  <el-card class="product-card" @click="handleClick">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <el-tag
          :type="statusType"
          size="small"
          class="status-tag"
        >
          {{ statusText }}
        </el-tag>
      </div>
      <el-dropdown
        trigger="click"
        @click.stop
        @command="handleCommand"
      >
        <el-button
          :icon="More"
          size="small"
          text
          class="more-btn"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">
              <el-icon><Edit /></el-icon>
              重命名
            </el-dropdown-item>
            <el-dropdown-item command="duplicate">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-dropdown-item>
            <el-dropdown-item command="export">
              <el-icon><Download /></el-icon>
              导出
            </el-dropdown-item>
            <el-dropdown-item
              command="delete"
              divided
              style="color: var(--el-color-danger)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 描述信息 -->
    <p class="product-description" v-if="product.description">
      {{ product.description }}
    </p>
    <p class="product-description empty" v-else>
      暂无描述
    </p>

    <!-- 进度展示 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="label">完整度</span>
        <span class="value">{{ product.completeness }}%</span>
      </div>
      <el-progress
        :percentage="product.completeness"
        :stroke-width="8"
        :show-text="false"
        :color="progressColor"
      />
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stat-item">
        <el-icon><Ticket /></el-icon>
        <span class="stat-value">{{ formatNumber(product.tokensUsed) }}</span>
        <span class="stat-label">Token</span>
      </div>
      <div class="stat-item">
        <el-icon><ChatDotRound /></el-icon>
        <span class="stat-value">{{ product.dialogueCount || 0 }}</span>
        <span class="stat-label">对话</span>
      </div>
      <div class="stat-item">
        <el-icon><Clock /></el-icon>
        <span class="stat-value">{{ formatTime(product.updatedAt) }}</span>
        <span class="stat-label">更新</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button
        type="primary"
        size="small"
        @click.stop="handleClick"
        :disabled="product.completeness === 100"
      >
        {{ product.completeness === 100 ? '查看PRD' : '继续编辑' }}
      </el-button>
      <el-button
        v-if="product.completeness >= 80"
        size="small"
        @click.stop="viewPRD"
      >
        预览PRD
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import {
  More,
  Edit,
  CopyDocument,
  Download,
  Delete,
  Ticket,
  ChatDotRound,
  Clock
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 使用相对时间插件
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// Props
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['click', 'edit', 'delete', 'duplicate'])

// 计算属性
const statusType = computed(() => {
  const statusMap = {
    draft: 'info',
    in_progress: 'warning',
    completed: 'success'
  }
  return statusMap[props.product.status] || 'info'
})

const statusText = computed(() => {
  const statusMap = {
    draft: '草稿',
    in_progress: '进行中',
    completed: '已完成'
  }
  return statusMap[props.product.status] || '草稿'
})

const progressColor = computed(() => {
  const percentage = props.product.completeness
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
})

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 格式化时间
const formatTime = (time) => {
  const now = dayjs()
  const target = dayjs(time)
  const diffDays = now.diff(target, 'day')
  
  if (diffDays === 0) {
    return target.fromNow() // 今天：X小时前
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return target.format('MM-DD')
  }
}

// 点击卡片
const handleClick = () => {
  emit('click')
}

// 查看PRD
const viewPRD = () => {
  // 导航到PRD预览页面
  window.open(`/products/${props.product.id}/prd`, '_blank')
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'edit':
      emit('edit')
      break
    case 'duplicate':
      emit('duplicate')
      break
    case 'export':
      // TODO: 实现导出功能
      ElMessage.info('导出功能开发中...')
      break
    case 'delete':
      emit('delete')
      break
  }
}
</script>

<style lang="scss" scoped>
.product-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  
  .header-info {
    flex: 1;
    overflow: hidden;
    
    .product-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .status-tag {
      font-size: 12px;
    }
  }
  
  .more-btn {
    margin-left: 8px;
    flex-shrink: 0;
  }
}

.product-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 42px;
  
  &.empty {
    color: var(--text-placeholder);
    font-style: italic;
  }
}

.progress-section {
  margin-bottom: 20px;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .label {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    
    .el-icon {
      font-size: 20px;
      color: var(--primary-color);
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.action-section {
  display: flex;
  gap: 8px;
  margin-top: auto;
  
  .el-button {
    flex: 1;
  }
}

// 暗色主题适配
[data-theme='dark'] {
  .product-card {
    &:hover {
      box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
    }
  }
}
</style>