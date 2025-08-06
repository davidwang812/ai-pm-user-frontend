<template>
  <el-container class="default-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="layout-aside">
      <div class="logo-container">
        <img src="@/assets/images/logo.png" alt="AI PM" class="logo" />
        <transition name="fade">
          <h1 v-if="!isCollapse" class="logo-title">AI产品经理</h1>
        </transition>
      </div>
      
      <!-- 导航菜单 -->
      <NavigationMenu :collapse="isCollapse" />
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <!-- 折叠按钮 -->
          <el-button
            text
            :icon="isCollapse ? 'Expand' : 'Fold'"
            @click="toggleCollapse"
            class="collapse-btn"
          />
          
          <!-- 面包屑 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- Token显示 -->
          <TokenDisplay />
          
          <!-- 消息通知 -->
          <el-badge :value="unreadCount" :hidden="!unreadCount" class="notification-badge">
            <el-button text :icon="Bell" @click="showNotifications" />
          </el-badge>
          
          <!-- 用户信息 -->
          <UserInfo />
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>

      <!-- 底部信息 -->
      <el-footer class="layout-footer">
        <div class="footer-content">
          <span>© 2025 AI Product Manager</span>
          <span class="separator">|</span>
          <span>智能PRD生成系统</span>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Bell } from '@element-plus/icons-vue'
import NavigationMenu from '@/components/layout/NavigationMenu.vue'
import UserInfo from '@/components/layout/UserInfo.vue'
import TokenDisplay from '@/components/business/TokenDisplay.vue'
import { useAppStore } from '@/store/modules/app'

// 路由
const route = useRoute()
const currentRoute = computed(() => route)

// 应用状态
const appStore = useAppStore()
const isCollapse = computed(() => appStore.sidebarCollapse)
const cachedViews = computed(() => appStore.cachedViews)

// 本地状态
const unreadCount = ref(0)

// 切换侧边栏折叠
const toggleCollapse = () => {
  appStore.toggleSidebar()
}

// 显示通知
const showNotifications = () => {
  ElMessage.info('通知功能开发中...')
}

// 监听路由变化，更新缓存
watch(() => route.name, (newName) => {
  if (newName && route.meta?.cache !== false) {
    appStore.addCachedView(newName)
  }
})

// 初始化
onMounted(() => {
  // 恢复侧边栏状态
  const savedCollapse = localStorage.getItem('sidebar-collapse')
  if (savedCollapse !== null) {
    appStore.setSidebarCollapse(savedCollapse === 'true')
  }
  
  // 模拟未读消息数
  setTimeout(() => {
    unreadCount.value = 3
  }, 2000)
})
</script>

<style lang="scss" scoped>
.default-layout {
  height: 100vh;
  
  .layout-aside {
    background-color: #001529;
    transition: width 0.3s ease;
    overflow-x: hidden;
    
    .logo-container {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      .logo {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }
      
      .logo-title {
        margin-left: 12px;
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        white-space: nowrap;
      }
    }
  }
  
  .layout-header {
    height: 60px;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .collapse-btn {
        font-size: 18px;
        margin-right: 20px;
      }
      
      .breadcrumb {
        font-size: 14px;
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .notification-badge {
        line-height: 1;
      }
    }
  }
  
  .layout-main {
    background-color: #f5f7fa;
    padding: 20px;
    overflow-y: auto;
  }
  
  .layout-footer {
    height: 48px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #e6e6e6;
    
    .footer-content {
      font-size: 14px;
      color: #909399;
      
      .separator {
        margin: 0 10px;
      }
    }
  }
}

// 过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 响应式设计
@media (max-width: 768px) {
  .default-layout {
    .layout-aside {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 999;
      transform: translateX(-100%);
      transition: transform 0.3s;
      
      &.mobile-show {
        transform: translateX(0);
      }
    }
    
    .layout-header {
      .breadcrumb {
        display: none;
      }
    }
  }
}</style>