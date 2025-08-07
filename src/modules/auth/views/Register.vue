<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>注册账号</h1>
        <p>加入AI产品经理，开启智能PRD之旅</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-position="top"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            data-testid="register-email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
            size="large"
            @input="handleEmailInput"
          />
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            data-testid="register-username"
            placeholder="请输入用户名（自动从邮箱提取，可修改）"
            prefix-icon="User"
            size="large"
            @input="() => hasManuallyEditedUsername = true"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            data-testid="register-password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            data-testid="register-confirm-password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="registerForm.agreement">
            我已阅读并同意
            <el-link type="primary" :underline="false">《用户协议》</el-link>
            和
            <el-link type="primary" :underline="false">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            data-testid="register-submit"
            :loading="loading"
            @click="handleRegister"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

const registerFormRef = ref()
const loading = ref(false)
const hasManuallyEditedUsername = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

// 当用户输入邮箱时，自动提取邮箱前缀作为用户名
const handleEmailInput = (value) => {
  // 只有在用户还没有手动编辑过用户名的情况下才自动填充
  if (!hasManuallyEditedUsername.value && value) {
    const atIndex = value.indexOf('@')
    if (atIndex > 0) {
      registerForm.username = value.substring(0, atIndex)
    }
  }
}

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validatePassword2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePassword2, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerForm.agreement) {
    ElMessage.warning('请阅读并同意用户协议和隐私政策')
    return
  }
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        ElMessage.success('注册成功！')
        router.push('/login')
      } catch (error) {
        // 不显示重复的错误消息（base.js已经处理了）
        console.log('注册错误:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 480px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px;
  }
  
  p {
    color: #909399;
    font-size: 14px;
    margin: 0;
  }
}

.register-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }
  
  // 修复输入框文字颜色太浅的问题
  :deep(.el-input__inner) {
    color: #303133 !important; // 深灰色，更清晰
    
    &::placeholder {
      color: #909399; // placeholder保持适度的浅灰
    }
  }
  
  // 确保输入时文字清晰可见
  :deep(.el-input) {
    .el-input__inner {
      font-size: 14px;
      
      &:focus {
        color: #303133 !important;
      }
    }
  }
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  color: #909399;
  font-size: 14px;
  
  a {
    color: #409eff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>