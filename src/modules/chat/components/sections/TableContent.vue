<template>
  <div class="table-content">
    <el-table
      :data="tableData"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column
        v-for="(header, index) in content.headers"
        :key="index"
        :prop="`col${index}`"
        :label="header"
        :min-width="getColumnWidth(index)"
      />
    </el-table>
    
    <!-- 表格说明 -->
    <div v-if="metadata.description" class="table-description">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ metadata.description }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  content: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.headers && value.rows
    }
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// 转换表格数据
const tableData = computed(() => {
  return props.content.rows.map(row => {
    const obj = {}
    row.forEach((cell, index) => {
      obj[`col${index}`] = cell
    })
    return obj
  })
})

// 计算列宽
const getColumnWidth = (index) => {
  // 可以根据内容动态计算宽度
  const widths = props.metadata.columnWidths || []
  return widths[index] || 120
}
</script>

<style lang="scss" scoped>
.table-content {
  .el-table {
    font-size: 14px;
    
    :deep(.el-table__header) {
      th {
        background-color: #f5f7fa;
        color: #303133;
        font-weight: 600;
      }
    }
    
    :deep(.el-table__body) {
      td {
        color: #606266;
      }
    }
  }
  
  .table-description {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
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
</style>