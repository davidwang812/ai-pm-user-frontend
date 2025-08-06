<template>
  <div class="list-content">
    <div
      v-for="(group, index) in listGroups"
      :key="index"
      class="list-group"
    >
      <h4 v-if="group.title" class="group-title">{{ group.title }}</h4>
      
      <ul v-if="!metadata.ordered" class="list-items">
        <li v-for="(item, itemIndex) in group.items" :key="itemIndex">
          <span class="item-icon">
            <el-icon :color="metadata.iconColor || '#409eff'">
              <component :is="getIcon()" />
            </el-icon>
          </span>
          <span class="item-content">{{ item }}</span>
        </li>
      </ul>
      
      <ol v-else class="list-items ordered">
        <li v-for="(item, itemIndex) in group.items" :key="itemIndex">
          <span class="item-content">{{ item }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  CircleCheck,
  Star,
  ArrowRight,
  Document
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  content: {
    type: [Array, Object],
    required: true
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// 处理列表数据
const listGroups = computed(() => {
  // 如果content是数组，直接使用
  if (Array.isArray(props.content)) {
    // 检查是否是分组格式
    if (props.content.length > 0 && typeof props.content[0] === 'object' && 'title' in props.content[0]) {
      return props.content
    }
    // 否则作为单个列表处理
    return [{
      title: '',
      items: props.content
    }]
  }
  
  // 如果是对象，转换为数组格式
  if (typeof props.content === 'object') {
    return Object.entries(props.content).map(([title, items]) => ({
      title,
      items: Array.isArray(items) ? items : [items]
    }))
  }
  
  return []
})

// 获取图标
const getIcon = () => {
  const iconMap = {
    check: CircleCheck,
    star: Star,
    arrow: ArrowRight,
    document: Document
  }
  return iconMap[props.metadata.icon] || CircleCheck
}
</script>

<style lang="scss" scoped>
.list-content {
  .list-group {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .group-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 12px;
    }
    
    .list-items {
      margin: 0;
      padding: 0;
      list-style: none;
      
      &.ordered {
        counter-reset: item;
        
        li {
          counter-increment: item;
          
          &::before {
            content: counter(item) ".";
            display: inline-block;
            width: 24px;
            margin-right: 8px;
            color: #409eff;
            font-weight: 600;
          }
        }
      }
      
      li {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
        line-height: 1.6;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .item-icon {
          display: inline-flex;
          align-items: center;
          margin-right: 12px;
          margin-top: 2px;
          flex-shrink: 0;
          
          .el-icon {
            font-size: 16px;
          }
        }
        
        .item-content {
          flex: 1;
          color: #606266;
        }
      }
    }
  }
  
  // 特殊样式变体
  &.compact {
    .list-items li {
      margin-bottom: 8px;
    }
  }
  
  &.highlight {
    .list-items li {
      padding: 8px 12px;
      background-color: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 8px;
      
      &:hover {
        background-color: #ecf5ff;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .list-content {
    .group-title {
      font-size: 15px;
    }
    
    .list-items li {
      font-size: 14px;
    }
  }
}
</style>