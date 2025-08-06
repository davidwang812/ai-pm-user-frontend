<template>
  <div class="product-create-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <h1 class="page-title">创建新产品</h1>
        </template>
      </el-page-header>
    </div>

    <!-- 创建表单 -->
    <el-row :gutter="40">
      <el-col :xs="24" :md="16">
        <el-card class="form-card">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            size="large"
          >
            <!-- 产品名称 -->
            <el-form-item label="产品名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入产品名称，例如：智能客服系统"
                maxlength="50"
                show-word-limit
                clearable
                @input="generateSuggestions"
              />
              <div class="field-hint">
                给您的产品起一个清晰、易记的名称
              </div>
            </el-form-item>

            <!-- 产品描述 -->
            <el-form-item label="产品描述（选填）" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                placeholder="简单描述一下您的产品愿景或核心功能..."
                :rows="4"
                maxlength="500"
                show-word-limit
              />
              <div class="field-hint">
                可以稍后在AI对话中详细完善
              </div>
            </el-form-item>

            <!-- 行业选择 -->
            <el-form-item label="所属行业" prop="industry">
              <el-select
                v-model="formData.industry"
                placeholder="选择产品所属行业"
                clearable
              >
                <el-option
                  v-for="item in industryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div class="field-hint">
                选择行业有助于AI提供更精准的建议
              </div>
            </el-form-item>

            <!-- 产品类型 -->
            <el-form-item label="产品类型" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio-button label="saas">SaaS软件</el-radio-button>
                <el-radio-button label="app">移动应用</el-radio-button>
                <el-radio-button label="hardware">硬件产品</el-radio-button>
                <el-radio-button label="platform">平台服务</el-radio-button>
                <el-radio-button label="other">其他</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <!-- 目标用户 -->
            <el-form-item label="目标用户（选填）" prop="targetUsers">
              <el-input
                v-model="formData.targetUsers"
                placeholder="简单描述您的目标用户群体，例如：中小企业、个人开发者等"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <!-- 操作按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="creating"
                @click="handleCreate"
              >
                开始创建
              </el-button>
              <el-button size="large" @click="goBack">
                取消
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 侧边提示 -->
      <el-col :xs="24" :md="8">
        <!-- AI建议 -->
        <el-card class="tips-card" v-if="suggestions.length > 0">
          <template #header>
            <div class="card-header">
              <el-icon><Opportunity /></el-icon>
              <span>AI建议</span>
            </div>
          </template>
          <div class="suggestions">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-item"
              @click="applySuggestion(suggestion)"
            >
              <el-icon><MagicStick /></el-icon>
              <span>{{ suggestion }}</span>
            </div>
          </div>
        </el-card>

        <!-- 创建提示 -->
        <el-card class="tips-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>创建提示</span>
            </div>
          </template>
          <ul class="tips-list">
            <li>产品名称要简洁明了，体现核心价值</li>
            <li>选择正确的行业有助于获得更精准的AI建议</li>
            <li>不用担心信息不完整，AI会引导您逐步完善</li>
            <li>创建后可以随时修改产品信息</li>
          </ul>
        </el-card>

        <!-- 套餐限制提醒 -->
        <el-alert
          v-if="remainingProducts <= 3"
          :title="`当前套餐剩余 ${remainingProducts} 个产品配额`"
          type="warning"
          :closable="false"
          show-icon
          class="quota-alert"
        >
          <template #default>
            <el-link type="primary" @click="goToSubscription">
              升级套餐
            </el-link>
            获得更多产品配额
          </template>
        </el-alert>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Opportunity,
  InfoFilled,
  MagicStick
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { productAPI } from '@/services/api/product'
import { debounce } from 'lodash-es'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const formRef = ref()

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  industry: '',
  type: 'saas',
  targetUsers: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '产品名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  industry: [
    { required: true, message: '请选择所属行业', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择产品类型', trigger: 'change' }
  ]
}

// 行业选项
const industryOptions = [
  { label: '互联网/科技', value: 'tech' },
  { label: '金融', value: 'finance' },
  { label: '教育', value: 'education' },
  { label: '医疗健康', value: 'healthcare' },
  { label: '电商/零售', value: 'ecommerce' },
  { label: '企业服务', value: 'enterprise' },
  { label: '文娱/内容', value: 'media' },
  { label: '物流/供应链', value: 'logistics' },
  { label: '制造业', value: 'manufacturing' },
  { label: '房地产', value: 'realestate' },
  { label: '其他', value: 'other' }
]

// 状态
const creating = ref(false)
const suggestions = ref([])

// 计算属性
const remainingProducts = computed(() => {
  const limit = authStore.user?.subscription?.maxProducts || 3
  const used = authStore.user?.subscription?.productsCount || 0
  return limit - used
})

// 生成AI建议（防抖）
const generateSuggestions = debounce((value) => {
  if (!value || value.length < 2) {
    suggestions.value = []
    return
  }
  
  // 模拟AI建议生成
  // TODO: 实际项目中调用AI接口
  const baseSuggestions = [
    `${value}管理系统`,
    `智能${value}平台`,
    `${value}助手`,
    `${value}解决方案`,
    `${value}工具`
  ]
  
  suggestions.value = baseSuggestions.slice(0, 3)
}, 500)

// 应用建议
const applySuggestion = (suggestion) => {
  formData.name = suggestion
  suggestions.value = []
}

// 创建产品
const handleCreate = async () => {
  // 表单验证
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  // 检查配额
  if (remainingProducts.value <= 0) {
    ElMessage.warning('产品配额已用完，请升级套餐')
    return
  }
  
  creating.value = true
  
  try {
    // 调用创建API
    const response = await productAPI.create({
      name: formData.name,
      description: formData.description,
      metadata: {
        industry: formData.industry,
        type: formData.type,
        targetUsers: formData.targetUsers
      }
    })
    
    if (response.success) {
      ElMessage.success('产品创建成功，开始AI对话')
      
      // 跳转到AI对话页面
      router.push(`/products/${response.data.productId}/chat`)
    }
  } catch (error) {
    console.error('创建产品失败:', error)
    ElMessage.error('创建产品失败，请重试')
  } finally {
    creating.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 跳转订阅页面
const goToSubscription = () => {
  router.push('/subscription')
}
</script>

<style lang="scss" scoped>
.product-create-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
}

.form-card {
  :deep(.el-form-item) {
    margin-bottom: 28px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.el-form-item__label) {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .field-hint {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 8px;
    line-height: 1.5;
  }
}

.tips-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    
    .el-icon {
      font-size: 18px;
      color: var(--primary-color);
    }
  }
  
  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #e6e8eb;
        transform: translateX(4px);
      }
      
      .el-icon {
        color: var(--primary-color);
        flex-shrink: 0;
      }
      
      span {
        font-size: 14px;
        color: var(--text-primary);
      }
    }
  }
  
  .tips-list {
    margin: 0;
    padding-left: 20px;
    
    li {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.8;
      
      &::marker {
        color: var(--primary-color);
      }
    }
  }
}

.quota-alert {
  :deep(.el-alert__content) {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 20px;
    }
  }
  
  .form-card {
    margin-bottom: 20px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 15px !important;
  }
}
</style>