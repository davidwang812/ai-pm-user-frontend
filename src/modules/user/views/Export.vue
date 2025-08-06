<template>
  <div class="export-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">数据导出</h1>
      <p class="page-subtitle">导出您的产品数据和对话记录</p>
    </div>

    <!-- 导出选项 -->
    <el-row :gutter="20">
      <!-- 产品数据导出 -->
      <el-col :xs="24" :md="12">
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <h3>产品数据</h3>
              <el-tag type="success">可导出</el-tag>
            </div>
          </template>
          
          <div class="export-content">
            <p class="export-desc">
              导出您创建的所有产品信息，包括产品名称、描述、创建时间等基本信息。
            </p>
            
            <div class="export-options">
              <h4>导出选项</h4>
              <el-checkbox-group v-model="productExportOptions">
                <el-checkbox label="basic">基本信息</el-checkbox>
                <el-checkbox label="conversations">对话记录</el-checkbox>
                <el-checkbox label="prd">PRD文档</el-checkbox>
                <el-checkbox label="stats">使用统计</el-checkbox>
              </el-checkbox-group>
            </div>
            
            <div class="export-format">
              <h4>导出格式</h4>
              <el-radio-group v-model="productExportFormat">
                <el-radio label="json">JSON</el-radio>
                <el-radio label="excel">Excel</el-radio>
                <el-radio label="pdf">PDF</el-radio>
              </el-radio-group>
            </div>
            
            <el-button
              type="primary"
              :loading="productExporting"
              @click="exportProducts"
              :disabled="productExportOptions.length === 0"
            >
              <el-icon><Download /></el-icon>
              导出产品数据
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 对话记录导出 -->
      <el-col :xs="24" :md="12">
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <h3>对话记录</h3>
              <el-tag type="success">可导出</el-tag>
            </div>
          </template>
          
          <div class="export-content">
            <p class="export-desc">
              导出与AI的所有对话记录，包括提问、回答、生成的内容等。
            </p>
            
            <div class="export-options">
              <h4>时间范围</h4>
              <el-date-picker
                v-model="chatDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </div>
            
            <div class="export-format">
              <h4>导出格式</h4>
              <el-radio-group v-model="chatExportFormat">
                <el-radio label="txt">文本文件</el-radio>
                <el-radio label="md">Markdown</el-radio>
                <el-radio label="json">JSON</el-radio>
              </el-radio-group>
            </div>
            
            <el-button
              type="primary"
              :loading="chatExporting"
              @click="exportChats"
            >
              <el-icon><Download /></el-icon>
              导出对话记录
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 使用报告导出 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="12">
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <h3>使用报告</h3>
              <el-tag type="success">可导出</el-tag>
            </div>
          </template>
          
          <div class="export-content">
            <p class="export-desc">
              生成详细的使用报告，包括Token使用量、费用统计、服务调用次数等。
            </p>
            
            <div class="export-options">
              <h4>报告周期</h4>
              <el-select v-model="reportPeriod" style="width: 100%">
                <el-option label="最近7天" value="7days" />
                <el-option label="最近30天" value="30days" />
                <el-option label="最近3个月" value="3months" />
                <el-option label="自定义时间" value="custom" />
              </el-select>
              
              <el-date-picker
                v-if="reportPeriod === 'custom'"
                v-model="reportDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%; margin-top: 10px"
              />
            </div>
            
            <div class="export-format">
              <h4>报告格式</h4>
              <el-radio-group v-model="reportFormat">
                <el-radio label="pdf">PDF报告</el-radio>
                <el-radio label="excel">Excel表格</el-radio>
              </el-radio-group>
            </div>
            
            <el-button
              type="primary"
              :loading="reportExporting"
              @click="exportReport"
            >
              <el-icon><Document /></el-icon>
              生成使用报告
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 账户数据导出 -->
      <el-col :xs="24" :md="12">
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <h3>账户数据</h3>
              <el-tag type="warning">需要验证</el-tag>
            </div>
          </template>
          
          <div class="export-content">
            <p class="export-desc">
              导出您的完整账户数据，包括个人信息、设置、订阅历史等。
            </p>
            
            <div class="export-warning">
              <el-alert
                title="安全提示"
                type="warning"
                :closable="false"
                show-icon
              >
                导出账户数据包含敏感信息，请妥善保管导出的文件。
              </el-alert>
            </div>
            
            <div class="export-options">
              <el-checkbox v-model="includeApiKeys">
                包含API密钥（将被加密）
              </el-checkbox>
            </div>
            
            <el-button
              type="primary"
              :loading="accountExporting"
              @click="exportAccount"
            >
              <el-icon><User /></el-icon>
              导出账户数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 导出历史 -->
    <el-card class="history-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <h3>导出历史</h3>
          <el-button text @click="loadExportHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table
        :data="exportHistory"
        style="width: 100%"
        v-loading="historyLoading"
      >
        <el-table-column prop="created_at" label="导出时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getExportTypeTag(row.type)" size="small">
              {{ getExportTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="格式" width="100" />
        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'"
              size="small"
            >
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed' && row.download_url"
              type="primary"
              text
              size="small"
              @click="downloadExport(row)"
            >
              下载
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              text
              size="small"
              disabled
            >
              处理中...
            </el-button>
            <el-button
              type="danger"
              text
              size="small"
              @click="deleteExport(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  Document,
  User,
  Refresh
} from '@element-plus/icons-vue'
import { productAPI } from '@/services/api/product'
import { chatAPI } from '@/services/api/chat'
import { usageAPI } from '@/services/api/usage'
import { userAPI } from '@/services/api/user'
import dayjs from 'dayjs'

// 产品导出
const productExportOptions = ref(['basic', 'conversations'])
const productExportFormat = ref('json')
const productExporting = ref(false)

// 对话导出
const chatDateRange = ref(null)
const chatExportFormat = ref('txt')
const chatExporting = ref(false)

// 报告导出
const reportPeriod = ref('30days')
const reportDateRange = ref(null)
const reportFormat = ref('pdf')
const reportExporting = ref(false)

// 账户导出
const includeApiKeys = ref(false)
const accountExporting = ref(false)

// 导出历史
const exportHistory = ref([])
const historyLoading = ref(false)

// 格式化函数
const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getExportTypeTag = (type) => {
  const map = {
    products: '',
    chats: 'success',
    report: 'warning',
    account: 'danger'
  }
  return map[type] || 'info'
}

const getExportTypeName = (type) => {
  const map = {
    products: '产品数据',
    chats: '对话记录',
    report: '使用报告',
    account: '账户数据'
  }
  return map[type] || type
}

const getStatusName = (status) => {
  const map = {
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

// 导出产品数据
const exportProducts = async () => {
  productExporting.value = true
  
  try {
    const response = await productAPI.exportProducts({
      options: productExportOptions.value,
      format: productExportFormat.value
    })
    
    // 处理下载
    handleDownload(response.data, `products_${dayjs().format('YYYYMMDD')}.${productExportFormat.value}`)
    
    ElMessage.success('产品数据导出成功')
    loadExportHistory()
  } catch (error) {
    console.error('导出产品数据失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    productExporting.value = false
  }
}

// 导出对话记录
const exportChats = async () => {
  if (!chatDateRange.value) {
    ElMessage.warning('请选择导出的时间范围')
    return
  }
  
  chatExporting.value = true
  
  try {
    const response = await chatAPI.exportChats({
      start_date: dayjs(chatDateRange.value[0]).format('YYYY-MM-DD'),
      end_date: dayjs(chatDateRange.value[1]).format('YYYY-MM-DD'),
      format: chatExportFormat.value
    })
    
    // 处理下载
    handleDownload(response.data, `chats_${dayjs().format('YYYYMMDD')}.${chatExportFormat.value}`)
    
    ElMessage.success('对话记录导出成功')
    loadExportHistory()
  } catch (error) {
    console.error('导出对话记录失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    chatExporting.value = false
  }
}

// 导出使用报告
const exportReport = async () => {
  reportExporting.value = true
  
  try {
    let params = {
      format: reportFormat.value
    }
    
    if (reportPeriod.value === 'custom' && reportDateRange.value) {
      params.start_date = dayjs(reportDateRange.value[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(reportDateRange.value[1]).format('YYYY-MM-DD')
    } else {
      params.period = reportPeriod.value
    }
    
    const response = await usageAPI.exportReport(params)
    
    // 处理下载
    handleDownload(response.data, `usage_report_${dayjs().format('YYYYMMDD')}.${reportFormat.value}`)
    
    ElMessage.success('使用报告生成成功')
    loadExportHistory()
  } catch (error) {
    console.error('生成使用报告失败:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    reportExporting.value = false
  }
}

// 导出账户数据
const exportAccount = async () => {
  try {
    // 安全验证
    await ElMessageBox.confirm(
      '导出账户数据包含敏感信息，请确认您要继续此操作。',
      '安全确认',
      {
        confirmButtonText: '确认导出',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    accountExporting.value = true
    
    const response = await userAPI.exportAccountData({
      include_api_keys: includeApiKeys.value
    })
    
    // 处理下载
    handleDownload(response.data, `account_data_${dayjs().format('YYYYMMDD')}.json`)
    
    ElMessage.success('账户数据导出成功')
    loadExportHistory()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出账户数据失败:', error)
      ElMessage.error('导出失败，请重试')
    }
  } finally {
    accountExporting.value = false
  }
}

// 处理文件下载
const handleDownload = (data, filename) => {
  const blob = new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// 加载导出历史
const loadExportHistory = async () => {
  historyLoading.value = true
  
  try {
    const response = await userAPI.getExportHistory()
    if (response.success) {
      exportHistory.value = response.data || []
    }
  } catch (error) {
    console.error('加载导出历史失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 下载历史导出
const downloadExport = async (row) => {
  try {
    const response = await userAPI.downloadExport(row.id)
    handleDownload(response.data, row.filename)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 删除导出记录
const deleteExport = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条导出记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userAPI.deleteExport(row.id)
    ElMessage.success('删除成功')
    loadExportHistory()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 生命周期
onMounted(() => {
  loadExportHistory()
})
</script>

<style lang="scss" scoped>
.export-container {
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

// 导出卡片
.export-card {
  height: 100%;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
    }
  }
  
  .export-content {
    .export-desc {
      color: var(--text-secondary);
      margin: 0 0 24px;
    }
    
    .export-options,
    .export-format {
      margin-bottom: 24px;
      
      h4 {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 12px;
      }
      
      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }
    
    .export-warning {
      margin-bottom: 16px;
    }
  }
}

// 历史记录卡片
.history-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    .page-title {
      font-size: 24px;
    }
  }
  
  .export-card {
    margin-bottom: 16px;
  }
}
</style>