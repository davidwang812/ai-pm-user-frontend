<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">个人设置</h1>
      <p class="page-subtitle">管理您的账户信息和偏好设置</p>
    </div>

    <!-- 设置选项卡 -->
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="profile">
        <el-card>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="120px"
            label-position="right"
          >
            <!-- 头像 -->
            <el-form-item label="头像">
              <div class="avatar-uploader">
                <el-avatar
                  :size="100"
                  :src="profileForm.avatar"
                  @click="selectAvatar"
                >
                  <el-icon :size="30"><User /></el-icon>
                </el-avatar>
                <div class="avatar-actions">
                  <el-button size="small" @click="selectAvatar">
                    更换头像
                  </el-button>
                  <p class="avatar-hint">
                    建议尺寸 200x200，支持 JPG、PNG 格式
                  </p>
                </div>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  style="display: none"
                  @change="handleAvatarChange"
                />
              </div>
            </el-form-item>

            <!-- 用户名 -->
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="profileForm.username"
                disabled
                style="width: 300px"
              >
                <template #append>
                  <el-tooltip content="用户名不可修改">
                    <el-icon><InfoFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>

            <!-- 昵称 -->
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="profileForm.nickname"
                placeholder="请输入昵称"
                maxlength="20"
                show-word-limit
                style="width: 300px"
              />
            </el-form-item>

            <!-- 邮箱 -->
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="profileForm.email"
                placeholder="请输入邮箱"
                style="width: 300px"
              />
              <el-button
                v-if="!profileForm.emailVerified"
                type="primary"
                link
                @click="sendVerificationEmail"
              >
                验证邮箱
              </el-button>
              <el-tag v-else type="success" size="small">
                已验证
              </el-tag>
            </el-form-item>

            <!-- 手机号 -->
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="profileForm.phone"
                placeholder="请输入手机号"
                style="width: 300px"
              />
            </el-form-item>

            <!-- 公司 -->
            <el-form-item label="公司" prop="company">
              <el-input
                v-model="profileForm.company"
                placeholder="请输入公司名称"
                style="width: 300px"
              />
            </el-form-item>

            <!-- 个人简介 -->
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="4"
                placeholder="介绍一下自己..."
                maxlength="200"
                show-word-limit
                style="width: 500px"
              />
            </el-form-item>

            <!-- 操作按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                :loading="profileSaving"
                @click="saveProfile"
              >
                保存修改
              </el-button>
              <el-button @click="resetProfile">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 账户安全 -->
      <el-tab-pane label="账户安全" name="security">
        <el-card>
          <!-- 修改密码 -->
          <div class="security-section">
            <h3>修改密码</h3>
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="120px"
              label-position="right"
            >
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  show-password
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="passwordSaving"
                  @click="changePassword"
                >
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-divider />

          <!-- 两步验证 -->
          <div class="security-section">
            <h3>两步验证</h3>
            <p class="section-desc">
              启用两步验证可以大幅提高账户安全性
            </p>
            <div class="two-factor-status">
              <el-switch
                v-model="twoFactorEnabled"
                size="large"
                @change="toggleTwoFactor"
              />
              <span class="status-text">
                {{ twoFactorEnabled ? '已启用' : '未启用' }}
              </span>
            </div>
          </div>

          <el-divider />

          <!-- 登录历史 -->
          <div class="security-section">
            <h3>最近登录</h3>
            <el-table :data="loginHistory" style="width: 100%">
              <el-table-column prop="time" label="登录时间" width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.time) }}
                </template>
              </el-table-column>
              <el-table-column prop="ip" label="IP地址" width="150" />
              <el-table-column prop="location" label="登录地点" />
              <el-table-column prop="device" label="设备" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="row.success ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.success ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 偏好设置 -->
      <el-tab-pane label="偏好设置" name="preferences">
        <el-card>
          <!-- 主题设置 -->
          <div class="preference-section">
            <h3>主题设置</h3>
            <el-radio-group v-model="preferences.theme" @change="savePreferences">
              <el-radio-button label="light">
                <el-icon><Sunny /></el-icon>
                浅色主题
              </el-radio-button>
              <el-radio-button label="dark">
                <el-icon><Moon /></el-icon>
                深色主题
              </el-radio-button>
              <el-radio-button label="auto">
                <el-icon><Monitor /></el-icon>
                跟随系统
              </el-radio-button>
            </el-radio-group>
          </div>

          <el-divider />

          <!-- 语言设置 -->
          <div class="preference-section">
            <h3>语言设置</h3>
            <el-select
              v-model="preferences.language"
              placeholder="选择语言"
              style="width: 200px"
              @change="savePreferences"
            >
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </div>

          <el-divider />

          <!-- 通知设置 -->
          <div class="preference-section">
            <h3>通知设置</h3>
            <div class="notification-settings">
              <el-form label-width="200px">
                <el-form-item label="邮件通知">
                  <el-switch
                    v-model="preferences.notifications.email"
                    @change="savePreferences"
                  />
                </el-form-item>
                <el-form-item label="产品完成提醒">
                  <el-switch
                    v-model="preferences.notifications.productComplete"
                    @change="savePreferences"
                  />
                </el-form-item>
                <el-form-item label="订阅到期提醒">
                  <el-switch
                    v-model="preferences.notifications.subscriptionExpire"
                    @change="savePreferences"
                  />
                </el-form-item>
                <el-form-item label="Token额度提醒">
                  <el-switch
                    v-model="preferences.notifications.tokenLimit"
                    @change="savePreferences"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <el-divider />

          <!-- AI设置 -->
          <div class="preference-section">
            <h3>AI对话设置</h3>
            <el-form label-width="200px">
              <el-form-item label="默认对话语言">
                <el-select
                  v-model="preferences.ai.language"
                  style="width: 200px"
                  @change="savePreferences"
                >
                  <el-option label="中文" value="zh" />
                  <el-option label="English" value="en" />
                </el-select>
              </el-form-item>
              <el-form-item label="回复风格">
                <el-radio-group
                  v-model="preferences.ai.style"
                  @change="savePreferences"
                >
                  <el-radio label="concise">简洁</el-radio>
                  <el-radio label="detailed">详细</el-radio>
                  <el-radio label="creative">创意</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="自动保存对话">
                <el-switch
                  v-model="preferences.ai.autoSave"
                  @change="savePreferences"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- API密钥 -->
      <el-tab-pane label="API密钥" name="api">
        <el-card>
          <div class="api-section">
            <div class="section-header">
              <h3>API密钥管理</h3>
              <el-button type="primary" size="small" @click="createApiKey">
                创建新密钥
              </el-button>
            </div>
            <p class="section-desc">
              使用API密钥可以通过接口访问您的数据
            </p>

            <!-- API密钥列表 -->
            <el-table :data="apiKeys" style="width: 100%">
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="key" label="密钥" width="300">
                <template #default="{ row }">
                  <div class="api-key-cell">
                    <span v-if="!row.visible">
                      {{ row.key.replace(/./g, '•') }}
                    </span>
                    <span v-else>{{ row.key }}</span>
                    <el-button
                      :icon="row.visible ? View : Hide"
                      text
                      @click="toggleKeyVisibility(row)"
                    />
                    <el-button
                      :icon="CopyDocument"
                      text
                      @click="copyApiKey(row.key)"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column prop="lastUsed" label="最后使用" width="180">
                <template #default="{ row }">
                  {{ row.lastUsed ? formatDate(row.lastUsed) : '从未使用' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    text
                    :icon="Delete"
                    @click="deleteApiKey(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建API密钥对话框 -->
    <el-dialog
      v-model="apiKeyDialogVisible"
      title="创建API密钥"
      width="500px"
    >
      <el-form
        ref="apiKeyFormRef"
        :model="apiKeyForm"
        :rules="apiKeyRules"
        label-width="100px"
      >
        <el-form-item label="密钥名称" prop="name">
          <el-input
            v-model="apiKeyForm.name"
            placeholder="请输入密钥名称，例如：生产环境密钥"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="权限范围" prop="scopes">
          <el-checkbox-group v-model="apiKeyForm.scopes">
            <el-checkbox label="read">读取数据</el-checkbox>
            <el-checkbox label="write">写入数据</el-checkbox>
            <el-checkbox label="delete">删除数据</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="过期时间" prop="expireAt">
          <el-date-picker
            v-model="apiKeyForm.expireAt"
            type="date"
            placeholder="选择过期日期"
            :disabled-date="disabledDate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="apiKeyDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="apiKeyCreating"
          @click="confirmCreateApiKey"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 新创建的API密钥展示 -->
    <el-dialog
      v-model="newApiKeyVisible"
      title="API密钥创建成功"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
      >
        请立即复制并安全保存此密钥，关闭对话框后将无法再次查看完整密钥！
      </el-alert>
      <div class="new-api-key">
        <el-input
          v-model="newApiKey"
          readonly
          style="margin-top: 20px"
        >
          <template #append>
            <el-button @click="copyApiKey(newApiKey)">
              复制
            </el-button>
          </template>
        </el-input>
      </div>
      <template #footer>
        <el-button type="primary" @click="newApiKeyVisible = false">
          我已保存密钥
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  InfoFilled,
  Sunny,
  Moon,
  Monitor,
  View,
  Hide,
  CopyDocument,
  Delete
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { useTheme } from '@/composables/useTheme'
import { userAPI } from '@/services/api/user'
import dayjs from 'dayjs'

// 状态管理
const authStore = useAuthStore()
const { setTheme } = useTheme()

// 选项卡
const activeTab = ref('profile')

// 基本信息表单
const profileFormRef = ref()
const profileForm = reactive({
  avatar: '',
  username: '',
  nickname: '',
  email: '',
  emailVerified: false,
  phone: '',
  company: '',
  bio: ''
})
const profileRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}
const profileSaving = ref(false)
const avatarInput = ref()

// 密码表单
const passwordFormRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
const passwordSaving = ref(false)

// 安全设置
const twoFactorEnabled = ref(false)
const loginHistory = ref([])

// 偏好设置
const preferences = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: {
    email: true,
    productComplete: true,
    subscriptionExpire: true,
    tokenLimit: true
  },
  ai: {
    language: 'zh',
    style: 'detailed',
    autoSave: true
  }
})

// API密钥
const apiKeys = ref([])
const apiKeyDialogVisible = ref(false)
const apiKeyFormRef = ref()
const apiKeyForm = reactive({
  name: '',
  scopes: ['read'],
  expireAt: null
})
const apiKeyRules = {
  name: [
    { required: true, message: '请输入密钥名称', trigger: 'blur' }
  ],
  scopes: [
    { required: true, message: '请选择权限范围', trigger: 'change' }
  ]
}
const apiKeyCreating = ref(false)
const newApiKeyVisible = ref(false)
const newApiKey = ref('')

// 格式化函数
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 加载用户信息
const loadProfile = async () => {
  try {
    const response = await userAPI.getProfile()
    if (response.success) {
      const user = response.data.user
      profileForm.avatar = user.avatar_url || ''
      profileForm.username = user.email // 使用email作为username
      profileForm.nickname = user.nickname || ''
      profileForm.email = user.email
      profileForm.emailVerified = user.email_verified || false
      profileForm.phone = user.phone || ''
      profileForm.company = user.company || ''
      profileForm.bio = user.bio || ''
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 选择头像
const selectAvatar = () => {
  avatarInput.value.click()
}

// 处理头像变化
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG 格式的图片')
    return
  }
  
  // 验证文件大小
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }
  
  // 上传头像
  const formData = new FormData()
  formData.append('avatar', file)
  
  try {
    const response = await userAPI.uploadAvatar(formData)
    if (response.success) {
      profileForm.avatar = response.data.url
      ElMessage.success('头像上传成功')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error('上传头像失败')
  }
}

// 保存基本信息
const saveProfile = async () => {
  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  profileSaving.value = true
  
  try {
    const response = await userAPI.updateProfile({
      nickname: profileForm.nickname,
      company: profileForm.company,
      avatar_url: profileForm.avatar
    })
    if (response.success) {
      ElMessage.success('保存成功')
      // 更新store中的用户信息
      authStore.updateUser({
        nickname: profileForm.nickname,
        email: profileForm.email,
        avatar: profileForm.avatar
      })
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    profileSaving.value = false
  }
}

// 重置基本信息
const resetProfile = () => {
  loadProfile()
}

// 发送验证邮件
const sendVerificationEmail = async () => {
  try {
    const response = await userAPI.sendVerificationEmail()
    if (response.success) {
      ElMessage.success('验证邮件已发送，请查收')
    }
  } catch (error) {
    console.error('发送验证邮件失败:', error)
    ElMessage.error('发送验证邮件失败')
  }
}

// 修改密码
const changePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  passwordSaving.value = true
  
  try {
    const response = await userAPI.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.success) {
      ElMessage.success('密码修改成功')
      passwordFormRef.value.resetFields()
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.message || '修改密码失败')
  } finally {
    passwordSaving.value = false
  }
}

// 切换两步验证
const toggleTwoFactor = async (value) => {
  try {
    if (value) {
      // 启用两步验证
      const response = await userAPI.enableTwoFactor()
      if (response.success) {
        // TODO: 显示二维码让用户扫描
        ElMessage.success('两步验证已启用')
      }
    } else {
      // 禁用两步验证
      await ElMessageBox.confirm(
        '禁用两步验证会降低账户安全性，确定要禁用吗？',
        '确认禁用',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      const response = await userAPI.disableTwoFactor()
      if (response.success) {
        ElMessage.success('两步验证已禁用')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
      twoFactorEnabled.value = !value
    }
  }
}

// 加载登录历史
const loadLoginHistory = async () => {
  try {
    const response = await userAPI.getLoginHistory()
    if (response.success) {
      loginHistory.value = response.data
    }
  } catch (error) {
    console.error('加载登录历史失败:', error)
  }
}

// 加载偏好设置
const loadPreferences = async () => {
  try {
    const response = await userAPI.getPreferences()
    if (response.success) {
      const settings = response.data.settings
      // 映射后端数据到前端格式
      preferences.theme = settings.ui?.theme || 'light'
      preferences.language = settings.response_language || 'zh-CN'
      preferences.notifications = settings.notifications || {
        email: true,
        productComplete: true,
        subscriptionExpire: true,
        tokenLimit: true
      }
      preferences.ai = {
        language: settings.response_language || 'zh',
        style: settings.ui?.style || 'detailed',
        autoSave: settings.auto_save !== false
      }
      // 应用主题
      if (preferences.theme !== 'auto') {
        setTheme(preferences.theme)
      }
    }
  } catch (error) {
    console.error('加载偏好设置失败:', error)
  }
}

// 保存偏好设置
const savePreferences = async () => {
  try {
    // 映射前端格式到后端格式
    const response = await userAPI.updatePreferences({
      responseLanguage: preferences.language,
      autoSave: preferences.ai.autoSave,
      notifications: preferences.notifications,
      ui: {
        theme: preferences.theme,
        style: preferences.ai.style
      }
    })
    if (response.success) {
      ElMessage.success('设置已保存')
      // 应用主题
      if (preferences.theme !== 'auto') {
        setTheme(preferences.theme)
      }
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 加载API密钥
const loadApiKeys = async () => {
  try {
    const response = await userAPI.getApiKeys()
    if (response.success) {
      apiKeys.value = response.data.map(key => ({
        ...key,
        visible: false
      }))
    }
  } catch (error) {
    console.error('加载API密钥失败:', error)
  }
}

// 切换密钥可见性
const toggleKeyVisibility = (row) => {
  row.visible = !row.visible
}

// 复制API密钥
const copyApiKey = (key) => {
  navigator.clipboard.writeText(key).then(() => {
    ElMessage.success('密钥已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 创建API密钥
const createApiKey = () => {
  apiKeyForm.name = ''
  apiKeyForm.scopes = ['read']
  apiKeyForm.expireAt = null
  apiKeyDialogVisible.value = true
}

// 确认创建API密钥
const confirmCreateApiKey = async () => {
  const valid = await apiKeyFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  apiKeyCreating.value = true
  
  try {
    const response = await userAPI.createApiKey(apiKeyForm)
    if (response.success) {
      newApiKey.value = response.data.key
      apiKeyDialogVisible.value = false
      newApiKeyVisible.value = true
      loadApiKeys()
    }
  } catch (error) {
    console.error('创建API密钥失败:', error)
    ElMessage.error('创建API密钥失败')
  } finally {
    apiKeyCreating.value = false
  }
}

// 删除API密钥
const deleteApiKey = async (row) => {
  try {
    await ElMessageBox.confirm(
      '删除后将无法恢复，确定要删除这个API密钥吗？',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await userAPI.deleteApiKey(row.id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadApiKeys()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 禁用过去的日期
const disabledDate = (date) => {
  return date.valueOf() < Date.now()
}

// 生命周期
onMounted(() => {
  loadProfile()
  loadLoginHistory()
  loadPreferences()
  loadApiKeys()
})
</script>

<style lang="scss" scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

// 页面头部
.page-header {
  margin-bottom: 32px;
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  
  .page-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }
}

// 设置选项卡
.settings-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
}

// 头像上传
.avatar-uploader {
  display: flex;
  align-items: center;
  gap: 24px;
  
  .el-avatar {
    cursor: pointer;
    border: 2px solid #e4e7ed;
    
    &:hover {
      border-color: var(--primary-color);
    }
  }
  
  .avatar-actions {
    .avatar-hint {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
  }
}

// 安全设置
.security-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
  }
  
  .section-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 16px;
  }
  
  .two-factor-status {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .status-text {
      font-size: 14px;
      font-weight: 500;
    }
  }
}

// 偏好设置
.preference-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
  }
}

// API设置
.api-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .section-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 24px;
  }
  
  .api-key-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    
    span {
      flex: 1;
      font-family: monospace;
    }
  }
}

// 新API密钥
.new-api-key {
  :deep(.el-input) {
    font-family: monospace;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    .page-title {
      font-size: 24px;
    }
  }
  
  .avatar-uploader {
    flex-direction: column;
    align-items: flex-start;
  }
  
  :deep(.el-form) {
    .el-form-item__label {
      width: 100px !important;
    }
    
    .el-input,
    .el-textarea {
      width: 100% !important;
    }
  }
}
</style>