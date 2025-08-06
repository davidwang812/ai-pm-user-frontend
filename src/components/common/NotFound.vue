<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- 404 动画 -->
      <div class="error-code">
        <span class="digit">4</span>
        <span class="digit middle">0</span>
        <span class="digit">4</span>
      </div>
      
      <!-- 错误信息 -->
      <h1 class="error-title">页面未找到</h1>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移除
      </p>
      
      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><Back /></el-icon>
          返回上一页
        </el-button>
      </div>
      
      <!-- 建议链接 -->
      <div class="suggestions">
        <p>您可能想要访问：</p>
        <div class="suggestion-links">
          <router-link to="/dashboard" class="link-item">
            <el-icon><HomeFilled /></el-icon>
            工作台
          </router-link>
          <router-link to="/products" class="link-item">
            <el-icon><Document /></el-icon>
            我的产品
          </router-link>
          <router-link to="/subscription" class="link-item">
            <el-icon><CreditCard /></el-icon>
            订阅管理
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  HomeFilled,
  Back,
  Document,
  CreditCard
} from '@element-plus/icons-vue'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/dashboard')
}

// 返回上一页
const goBack = () => {
  // 如果有历史记录则返回，否则回首页
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.not-found-content {
  text-align: center;
  position: relative;
  z-index: 1;
  padding: 40px;
  max-width: 600px;
}

.error-code {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  
  .digit {
    font-size: 120px;
    font-weight: 700;
    color: white;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    animation: float 3s ease-in-out infinite;
    
    &.middle {
      margin: 0 20px;
      animation-delay: 0.5s;
    }
    
    &:last-child {
      animation-delay: 1s;
    }
  }
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: white;
  margin: 0 0 16px;
}

.error-description {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 40px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 60px;
  
  .el-button {
    min-width: 140px;
  }
}

.suggestions {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
  
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 20px;
  }
  
  .suggestion-links {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    
    .link-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
      
      .el-icon {
        font-size: 18px;
      }
    }
  }
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    
    &.circle-1 {
      width: 400px;
      height: 400px;
      top: -200px;
      left: -200px;
      animation: float-circle 20s ease-in-out infinite;
    }
    
    &.circle-2 {
      width: 300px;
      height: 300px;
      bottom: -150px;
      right: -150px;
      animation: float-circle 25s ease-in-out infinite reverse;
    }
    
    &.circle-3 {
      width: 200px;
      height: 200px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: float-circle 30s ease-in-out infinite;
    }
  }
}

// 动画
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes float-circle {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-code {
    .digit {
      font-size: 80px;
      
      &.middle {
        margin: 0 10px;
      }
    }
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .error-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
  
  .suggestion-links {
    flex-direction: column;
    
    .link-item {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>