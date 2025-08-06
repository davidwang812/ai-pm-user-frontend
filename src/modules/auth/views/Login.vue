<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo和标题 -->
      <div class="login-header">
        <img src="@/assets/images/logo.png" alt="AI PM" class="logo" />
        <h1 class="title">AI产品经理</h1>
        <p class="subtitle">智能PRD生成系统</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <!-- 邮箱输入 -->
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <!-- 密码输入 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- 记住登录 -->
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="loginForm.remember">记住登录状态</el-checkbox>
            <el-link type="primary" :underline="false" @click="showForgotPassword">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <!-- 注册链接 -->
        <el-form-item>
          <div class="register-link">
            还没有账号？
            <el-link type="primary" @click="goToRegister">立即注册</el-link>
          </div>
        </el-form-item>
      </el-form>

      <!-- 第三方登录 -->
      <el-divider>或</el-divider>
      <div class="third-party-login">
        <el-button circle size="large" @click="loginWithGoogle">
          <el-icon><img src="@/assets/images/google.svg" alt="Google" /></el-icon>
        </el-button>
        <el-button circle size="large" @click="loginWithGithub">
          <el-icon><img src="@/assets/images/github.svg" alt="GitHub" /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'
import { validateEmail } from '@/utils/validators'

// 路由和状态管理
const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref()

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  // 表单验证
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  
  try {
    // 调用登录API
    await authStore.login({
      email: loginForm.email,
      password: loginForm.password,
      remember: loginForm.remember
    })
    
    ElMessage.success('登录成功')
    
    // 跳转到主页或之前的页面
    const redirect = router.currentRoute.value.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    // 错误处理
    const message = error.response?.data?.message || '登录失败，请重试'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

// 跳转注册页
const goToRegister = () => {
  router.push('/register')
}

// 忘记密码
const showForgotPassword = () => {
  ElMessage.info('忘记密码功能开发中...')
}

// 第三方登录
const loginWithGoogle = () => {
  ElMessage.info('Google登录功能开发中...')
}

const loginWithGithub = () => {
  ElMessage.info('GitHub登录功能开发中...')
}

// 自动填充已保存的账号
onMounted(() => {
  const savedEmail = localStorage.getItem('remembered_email')
  if (savedEmail) {
    loginForm.email = savedEmail
    loginForm.remember = true
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 10px;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  .login-options {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .login-button {
    width: 100%;
    height: 42px;
    font-size: 16px;
    border-radius: 8px;
  }

  .register-link {
    text-align: center;
    color: #606266;
    font-size: 14px;
  }
}

.third-party-login {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;

  .el-button {
    width: 48px;
    height: 48px;
    
    img {
      width: 24px;
      height: 24px;
    }
  }
}

// 背景装饰
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;

  .shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 20s infinite ease-in-out;

    &.shape-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      left: -150px;
      animation-delay: 0s;
    }

    &.shape-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      right: -100px;
      animation-delay: 5s;
    }

    &.shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
      animation-delay: 10s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(20px) rotate(240deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    padding: 30px 20px;
  }
}
</style>