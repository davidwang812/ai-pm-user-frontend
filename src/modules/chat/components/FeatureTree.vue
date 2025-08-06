<template>
  <div class="feature-tree">
    <el-tree
      :data="treeData"
      :props="treeProps"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <span class="node-label">
            <el-icon v-if="data.icon" class="node-icon">
              <component :is="data.icon" />
            </el-icon>
            {{ node.label }}
          </span>
          <span class="node-info">
            <el-tag
              v-if="data.priority"
              :type="getPriorityType(data.priority)"
              size="small"
            >
              {{ data.priority }}
            </el-tag>
            <el-tag
              v-if="data.status"
              :type="getStatusType(data.status)"
              size="small"
            >
              {{ data.status }}
            </el-tag>
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Menu,
  User,
  ShoppingCart,
  DataAnalysis,
  Setting,
  Document,
  Search,
  Edit,
  View,
  Delete,
  Share,
  Download
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

// 树形控件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算树形数据
const treeData = computed(() => {
  // 为节点添加图标
  const addIcons = (nodes) => {
    return nodes.map(node => {
      const newNode = { ...node }
      
      // 根据节点名称或类型添加图标
      if (node.level === 1) {
        // 一级节点图标
        if (node.name.includes('用户')) newNode.icon = User
        else if (node.name.includes('产品')) newNode.icon = ShoppingCart
        else if (node.name.includes('数据')) newNode.icon = DataAnalysis
        else if (node.name.includes('管理')) newNode.icon = Setting
        else newNode.icon = Menu
      } else if (node.level === 2) {
        // 二级节点图标
        if (node.name.includes('查看')) newNode.icon = View
        else if (node.name.includes('编辑')) newNode.icon = Edit
        else if (node.name.includes('删除')) newNode.icon = Delete
        else if (node.name.includes('搜索')) newNode.icon = Search
        else if (node.name.includes('分享')) newNode.icon = Share
        else if (node.name.includes('导出')) newNode.icon = Download
        else newNode.icon = Document
      }
      
      // 递归处理子节点
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = addIcons(newNode.children)
      }
      
      return newNode
    })
  }
  
  return addIcons(props.data)
})

// 获取优先级类型
const getPriorityType = (priority) => {
  const map = {
    'P0': 'danger',
    'P1': 'warning',
    'P2': '',
    'P3': 'info'
  }
  return map[priority] || ''
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    '已完成': 'success',
    '开发中': 'warning',
    '待开发': 'info',
    '已取消': 'danger'
  }
  return map[status] || ''
}
</script>

<style lang="scss" scoped>
.feature-tree {
  :deep(.el-tree) {
    background-color: transparent;
    font-size: 14px;
    
    .el-tree-node {
      margin-bottom: 4px;
      
      .el-tree-node__content {
        height: auto;
        padding: 8px 12px;
        border-radius: 6px;
        
        &:hover {
          background-color: #ecf5ff;
        }
      }
      
      .el-tree-node__expand-icon {
        color: #909399;
        
        &.is-leaf {
          color: transparent;
        }
      }
    }
  }
  
  .tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    
    .node-label {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      overflow: hidden;
      
      .node-icon {
        font-size: 16px;
        color: #409eff;
        flex-shrink: 0;
      }
    }
    
    .node-info {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .feature-tree {
    :deep(.el-tree-node__content) {
      padding: 6px 8px;
    }
    
    .tree-node {
      .node-label {
        font-size: 13px;
        
        .node-icon {
          font-size: 14px;
        }
      }
    }
  }
}
</style>