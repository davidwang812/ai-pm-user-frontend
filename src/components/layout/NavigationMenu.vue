<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapse"
    background-color="#001529"
    text-color="rgba(255, 255, 255, 0.65)"
    active-text-color="#fff"
    :unique-opened="true"
    :collapse-transition="false"
    router
  >
    <template v-for="route in menuRoutes" :key="route.path">
      <!-- 有子菜单的项 -->
      <el-sub-menu v-if="route.children && route.children.length > 0" :index="route.path">
        <template #title>
          <el-icon>
            <component :is="route.meta?.icon || 'Document'" />
          </el-icon>
          <span>{{ route.meta?.title || route.name }}</span>
        </template>
        
        <el-menu-item
          v-for="child in route.children"
          :key="child.path"
          :index="resolvePath(route.path, child.path)"
        >
          <el-icon v-if="child.meta?.icon">
            <component :is="child.meta.icon" />
          </el-icon>
          <span>{{ child.meta?.title || child.name }}</span>
        </el-menu-item>
      </el-sub-menu>
      
      <!-- 无子菜单的项 -->
      <el-menu-item v-else :index="route.path">
        <el-icon>
          <component :is="route.meta?.icon || 'Document'" />
        </el-icon>
        <span>{{ route.meta?.title || route.name }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  Document,
  ChatLineRound,
  CreditCard,
  DataAnalysis,
  Setting,
  Download
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  collapse: {
    type: Boolean,
    default: false
  }
})

// 路由
const route = useRoute()

// 菜单路由配置
const menuRoutes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: {
      title: '工作台',
      icon: HomeFilled
    }
  },
  {
    path: '/products',
    name: 'Products',
    meta: {
      title: '产品管理',
      icon: Document
    },
    children: [
      {
        path: '/products',
        name: 'ProductList',
        meta: {
          title: '我的产品'
        }
      },
      {
        path: '/products/create',
        name: 'ProductCreate',
        meta: {
          title: '创建产品'
        }
      }
    ]
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    meta: {
      title: 'AI对话',
      icon: ChatLineRound,
      hidden: true // 从产品列表进入，不在菜单显示
    }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    meta: {
      title: '订阅管理',
      icon: CreditCard
    }
  },
  {
    path: '/usage',
    name: 'Usage',
    meta: {
      title: '使用统计',
      icon: DataAnalysis
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      title: '个人设置',
      icon: Setting
    }
  },
  {
    path: '/export',
    name: 'Export',
    meta: {
      title: '数据导出',
      icon: Download
    }
  }
]

// 过滤隐藏的菜单项
const visibleMenuRoutes = computed(() => {
  return menuRoutes.filter(route => !route.meta?.hidden)
})

// 当前激活的菜单
const activeMenu = computed(() => {
  const { path } = route
  
  // 处理子路由的情况
  if (path.startsWith('/products/') && path !== '/products/create') {
    return '/products'
  }
  
  return path
})

// 解析路径
const resolvePath = (parentPath, childPath) => {
  if (childPath.startsWith('/')) {
    return childPath
  }
  return `${parentPath}/${childPath}`
}

// 动态注册图标组件
const iconComponents = {
  HomeFilled,
  Document,
  ChatLineRound,
  CreditCard,
  DataAnalysis,
  Setting,
  Download
}

// 暴露给父组件的方法
defineExpose({
  menuRoutes: visibleMenuRoutes
})
</script>

<style lang="scss" scoped>
.el-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
  
  &:not(.el-menu--collapse) {
    width: 240px;
  }
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// 菜单项样式
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
  }
  
  &.is-active {
    background-color: var(--primary-color) !important;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #fff;
    }
  }
}

// 子菜单样式
:deep(.el-sub-menu) {
  .el-sub-menu__title {
    height: 48px;
    line-height: 48px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
  }
  
  &.is-active > .el-sub-menu__title {
    color: #fff !important;
  }
  
  .el-menu-item {
    min-width: 240px;
    background-color: #000c17 !important;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
    
    &.is-active {
      background-color: var(--primary-color) !important;
    }
  }
}

// 折叠状态样式
.el-menu--collapse {
  :deep(.el-sub-menu) {
    .el-sub-menu__icon-arrow {
      display: none;
    }
  }
}

// 图标样式
:deep(.el-icon) {
  margin-right: 10px;
  font-size: 18px;
  vertical-align: middle;
}

// 移动端适配
@media (max-width: 768px) {
  .el-menu {
    width: 240px !important;
  }
}
</style>