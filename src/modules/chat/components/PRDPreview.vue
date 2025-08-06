<template>
  <div class="prd-preview">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- PRD内容 -->
    <div v-else class="prd-document">
      <!-- 文档头部 -->
      <div class="document-header">
        <h1 class="document-title">{{ prdData.title }}</h1>
        <div class="document-meta">
          <span class="meta-item">
            <el-icon><Document /></el-icon>
            版本 {{ prdData.version }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(prdData.updatedAt) }}
          </span>
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ prdData.author }}
          </span>
        </div>
      </div>

      <!-- 目录导航 -->
      <div class="document-toc">
        <h3>目录</h3>
        <ul>
          <li
            v-for="section in prdData.sections"
            :key="section.id"
            :class="{ active: activeSection === section.id }"
            @click="scrollToSection(section.id)"
          >
            <span class="toc-number">{{ section.number }}</span>
            <span class="toc-title">{{ section.title }}</span>
            <span class="toc-status">
              <el-icon v-if="section.completed" color="#67c23a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else color="#e6a23c">
                <Warning />
              </el-icon>
            </span>
          </li>
        </ul>
      </div>

      <!-- 文档内容 -->
      <div class="document-content">
        <section
          v-for="section in prdData.sections"
          :key="section.id"
          :id="`section-${section.id}`"
          class="content-section"
        >
          <h2 class="section-title">
            <span class="section-number">{{ section.number }}</span>
            {{ section.title }}
          </h2>

          <!-- 不同类型的内容渲染 -->
          <component
            :is="getSectionComponent(section.type)"
            :content="section.content"
            :metadata="section.metadata"
          />

          <!-- AI建议 -->
          <div v-if="section.suggestions?.length" class="section-suggestions">
            <h4>
              <el-icon><Opportunity /></el-icon>
              AI建议完善以下内容：
            </h4>
            <ul>
              <li v-for="(suggestion, index) in section.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- 导出工具栏 -->
      <div class="export-toolbar">
        <el-button @click="exportAs('markdown')">
          <el-icon><Document /></el-icon>
          导出 Markdown
        </el-button>
        <el-button @click="exportAs('word')">
          <el-icon><Document /></el-icon>
          导出 Word
        </el-button>
        <el-button @click="exportAs('pdf')">
          <el-icon><Document /></el-icon>
          导出 PDF
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Calendar,
  User,
  CircleCheck,
  Warning,
  Opportunity
} from '@element-plus/icons-vue'
import { productAPI } from '@/services/api/product'

// 导入各种内容组件
import TextContent from './sections/TextContent.vue'
import TableContent from './sections/TableContent.vue'
import ChartContent from './sections/ChartContent.vue'
import ImageContent from './sections/ImageContent.vue'
import ListContent from './sections/ListContent.vue'

// Props
const props = defineProps({
  productId: {
    type: String,
    required: true
  }
})

// 状态
const loading = ref(true)
const prdData = ref({
  title: '',
  version: '1.0',
  author: '',
  updatedAt: new Date(),
  sections: []
})
const activeSection = ref('')

// 获取章节组件
const getSectionComponent = (type) => {
  const componentMap = {
    text: TextContent,
    table: TableContent,
    chart: ChartContent,
    image: ImageContent,
    list: ListContent
  }
  return componentMap[type] || TextContent
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 加载PRD数据
const loadPRD = async () => {
  loading.value = true
  
  try {
    const response = await productAPI.getPRD(props.productId)
    if (response.success) {
      prdData.value = response.data
      
      // 模拟PRD数据结构
      if (!prdData.value.sections?.length) {
        prdData.value.sections = generateDefaultSections()
      }
    }
  } catch (error) {
    console.error('加载PRD失败:', error)
    ElMessage.error('加载PRD失败')
  } finally {
    loading.value = false
  }
}

// 生成默认章节
const generateDefaultSections = () => {
  return [
    {
      id: 'overview',
      number: '1',
      title: '产品概述',
      type: 'text',
      completed: true,
      content: '本产品是一个创新的解决方案...',
      metadata: {}
    },
    {
      id: 'background',
      number: '2',
      title: '项目背景',
      type: 'text',
      completed: true,
      content: '在当前市场环境下...',
      metadata: {}
    },
    {
      id: 'users',
      number: '3',
      title: '目标用户',
      type: 'list',
      completed: true,
      content: [
        { title: '主要用户群体', items: ['企业管理者', '产品经理', '研发团队'] },
        { title: '用户画像', items: ['年龄25-40岁', '本科以上学历', '有技术背景'] }
      ],
      metadata: {}
    },
    {
      id: 'features',
      number: '4',
      title: '核心功能',
      type: 'table',
      completed: false,
      content: {
        headers: ['功能模块', '功能描述', '优先级', '开发周期'],
        rows: [
          ['用户管理', '用户注册、登录、权限管理', 'P0', '2周'],
          ['数据分析', '数据收集、处理、可视化展示', 'P1', '3周'],
          ['AI助手', '智能问答、内容生成、建议推荐', 'P0', '4周']
        ]
      },
      suggestions: ['需要补充具体的功能细节', '建议添加用户故事'],
      metadata: {}
    },
    {
      id: 'competitors',
      number: '5',
      title: '竞品分析',
      type: 'chart',
      completed: true,
      content: {
        type: 'radar',
        data: {
          categories: ['功能完整性', '用户体验', '技术先进性', '市场占有率', '价格竞争力'],
          series: [
            { name: '我们的产品', data: [85, 90, 95, 60, 85] },
            { name: '竞品A', data: [80, 85, 80, 90, 70] },
            { name: '竞品B', data: [75, 80, 85, 85, 80] }
          ]
        }
      },
      metadata: {}
    },
    {
      id: 'roadmap',
      number: '6',
      title: '产品路线图',
      type: 'text',
      completed: false,
      content: '产品开发计划...',
      suggestions: ['需要明确各阶段的里程碑', '建议添加时间节点'],
      metadata: {}
    }
  ]
}

// 滚动到指定章节
const scrollToSection = (sectionId) => {
  activeSection.value = sectionId
  const element = document.getElementById(`section-${sectionId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 监听滚动更新当前章节
const handleScroll = () => {
  const sections = document.querySelectorAll('.content-section')
  const scrollTop = document.querySelector('.prd-preview').scrollTop
  
  sections.forEach(section => {
    const rect = section.getBoundingClientRect()
    if (rect.top <= 100 && rect.bottom > 100) {
      activeSection.value = section.id.replace('section-', '')
    }
  })
}

// 导出功能
const exportAs = async (format) => {
  try {
    const response = await productAPI.exportPRD(props.productId, { format })
    
    // 处理文件下载
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 
            format === 'word' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
            'text/markdown'
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PRD_${prdData.value.title}_${format}.${format === 'word' ? 'docx' : format}`
    a.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`PRD已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  loadPRD()
  // 添加滚动监听
  const container = document.querySelector('.prd-preview')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  // 移除滚动监听
  const container = document.querySelector('.prd-preview')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style lang="scss" scoped>
.prd-preview {
  height: 100%;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.loading-container {
  padding: 40px;
}

.prd-document {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

// 文档头部
.document-header {
  background-color: white;
  padding: 32px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .document-title {
    font-size: 32px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px;
  }
  
  .document-meta {
    display: flex;
    gap: 24px;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #909399;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 目录导航
.document-toc {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: #303133;
  }
  
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    
    li {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      &.active {
        background-color: #ecf5ff;
        color: #409eff;
        
        .toc-number {
          background-color: #409eff;
          color: white;
        }
      }
      
      .toc-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background-color: #909399;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
      }
      
      .toc-title {
        flex: 1;
        font-size: 15px;
      }
      
      .toc-status {
        .el-icon {
          font-size: 20px;
        }
      }
    }
  }
}

// 文档内容
.document-content {
  .content-section {
    background-color: white;
    padding: 32px;
    border-radius: 8px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    
    .section-title {
      display: flex;
      align-items: center;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e4e7ed;
      
      .section-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background-color: #409eff;
        color: white;
        border-radius: 50%;
        font-size: 16px;
        margin-right: 16px;
      }
    }
    
    .section-suggestions {
      margin-top: 24px;
      padding: 16px;
      background-color: #fef0f0;
      border-radius: 6px;
      border-left: 4px solid #f56c6c;
      
      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #f56c6c;
        margin: 0 0 12px;
        
        .el-icon {
          font-size: 18px;
        }
      }
      
      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          color: #606266;
          line-height: 1.8;
        }
      }
    }
  }
}

// 导出工具栏
.export-toolbar {
  position: sticky;
  bottom: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  
  .el-button {
    min-width: 140px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .prd-document {
    padding: 20px 12px;
  }
  
  .document-header {
    padding: 20px;
    
    .document-title {
      font-size: 24px;
    }
    
    .document-meta {
      flex-wrap: wrap;
      gap: 12px;
    }
  }
  
  .document-toc {
    padding: 16px;
    
    ul li {
      padding: 8px 12px;
    }
  }
  
  .content-section {
    padding: 20px;
    
    .section-title {
      font-size: 20px;
    }
  }
  
  .export-toolbar {
    flex-wrap: wrap;
    
    .el-button {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>