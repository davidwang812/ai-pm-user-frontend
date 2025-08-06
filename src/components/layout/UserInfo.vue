<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="user-info-wrapper">
      <el-avatar :size="32" :src="userAvatar" class="user-avatar">
        <span v-if="!userAvatar">{{ avatarText }}</span>
      </el-avatar>
      <span class="user-name">{{ userName }}</span>
      <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
    </div>
    
    <template #dropdown>
      <el-dropdown-menu>
        <div class="user-dropdown-header">
          <el-avatar :size="48" :src="userAvatar">
            <span v-if="!userAvatar">{{ avatarText }}</span>
          </el-avatar>
          <div class="user-details">
            <div class="user-name-large">{{ userName }}</div>
            <div class="user-email">{{ userEmail }}</div>
            <el-tag :type="subscriptionType" size="small" class="subscription-tag">
              {{ subscriptionText }}
            </el-tag>
          </div>
        </div>
        
        <el-dropdown-item :icon="User" command="profile">
          个人资料
        </el-dropdown-item>
        
        <el-dropdown-item :icon="CreditCard" command="subscription">
          订阅管理
        </el-dropdown-item>
        
        <el-dropdown-item :icon="QuestionFilled" command="help">
          帮助中心
        </el-dropdown-item>
        
        <el-dropdown-item divided :icon="SwitchButton" command="logout">
          退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  ArrowDown,
  User,
  CreditCard,
  QuestionFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()

// 计算属性
const userName = computed(() => {
  return authStore.user?.username || '用户'
})

const userEmail = computed(() => {
  return authStore.user?.email || ''
})

const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

const avatarText = computed(() => {
  const name = userName.value
  return name.charAt(0).toUpperCase()
})

const subscriptionText = computed(() => {
  const plan = authStore.user?.subscription?.plan
  const planMap = {
    free: '免费版',
    basic: '基础版',
    professional: '专业版'
  }
  return planMap[plan] || '免费版'
})

const subscriptionType = computed(() => {
  const plan = authStore.user?.subscription?.plan
  const typeMap = {
    free: 'info',
    basic: 'warning',
    professional: 'success'
  }
  return typeMap[plan] || 'info'
})

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
      
    case 'subscription':
      router.push('/subscription')
      break
      
    case 'help':
      // 打开帮助中心
      window.open('https://help.aiproductmanager.com', '_blank')
      break
      
    case 'logout':
      // 确认退出
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 执行退出
        await authStore.logout()
        ElMessage.success('已安全退出')
      } catch (error) {
        // 用户取消退出
        if (error === 'cancel') {
          console.log('用户取消退出')
        }
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.user-info-wrapper {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  .user-avatar {
    margin-right: 8px;
    background-color: var(--primary-color);
    color: white;
    font-weight: 600;
  }
  
  .user-name {
    font-size: 14px;
    color: var(--text-primary);
    margin-right: 4px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .dropdown-arrow {
    font-size: 12px;
    color: var(--text-secondary);
    transition: transform 0.3s;
  }
}

// 下拉菜单样式
:global(.el-dropdown__popper) {
  .user-dropdown-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 12px;
    
    .el-avatar {
      flex-shrink: 0;
      background-color: var(--primary-color);
      color: white;
      font-weight: 600;
      font-size: 18px;
    }
    
    .user-details {
      flex: 1;
      overflow: hidden;
      
      .user-name-large {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      
      .user-email {
        font-size: 13px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 6px;
      }
      
      .subscription-tag {
        font-size: 12px;
      }
    }
  }
  
  .el-dropdown-menu {
    width: 280px;
  }
  
  .el-dropdown-menu__item {
    padding: 12px 16px;
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-info-wrapper {
    padding: 4px 8px;
    
    .user-name {
      display: none;
    }
  }
}
</style>