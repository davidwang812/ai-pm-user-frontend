<template>
  <div class="product-list-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">我的产品</h1>
        <p class="page-subtitle">管理和查看所有的PRD项目</p>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          size="large"
          :icon="Plus"
          @click="createProduct"
          :disabled="!canCreateMore"
        >
          创建产品
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索产品名称..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部状态" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            @change="handleSort"
          >
            <el-option label="最近更新" value="updatedAt" />
            <el-option label="创建时间" value="createdAt" />
            <el-option label="完整度" value="completeness" />
            <el-option label="名称" value="name" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" class="view-toggle">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon>
              卡片
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
              列表
            </el-radio-button>
          </el-radio-group>
        </el-col>
      </el-row>
    </el-card>

    <!-- 产品列表 - 卡片视图 -->
    <div v-if="viewMode === 'grid' && !loading" class="product-grid">
      <el-row :gutter="20" v-if="products.length > 0">
        <el-col
          v-for="product in products"
          :key="product.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <ProductCard
            :product="product"
            @click="openProduct(product)"
            @edit="editProduct(product)"
            @delete="deleteProduct(product)"
            @duplicate="duplicateProduct(product)"
          />
        </el-col>
      </el-row>
      
      <!-- 空状态 -->
      <EmptyState
        v-else
        title="还没有创建任何产品"
        description="开始创建您的第一个PRD项目"
        action-text="创建产品"
        @action="createProduct"
      />
    </div>

    <!-- 产品列表 - 列表视图 -->
    <el-card v-if="viewMode === 'list' && !loading" class="list-card">
      <el-table
        v-if="products.length > 0"
        :data="products"
        style="width: 100%"
        @row-click="openProduct"
      >
        <el-table-column prop="name" label="产品名称" min-width="200">
          <template #default="{ row }">
            <div class="product-name-cell">
              <span class="name">{{ row.name }}</span>
              <el-tag v-if="row.status === 'draft'" size="small" type="info">
                草稿
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="completeness" label="完整度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completeness"
              :color="getProgressColor(row.completeness)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="tokensUsed" label="Token消耗" width="120">
          <template #default="{ row }">
            {{ row.tokensUsed.toLocaleString() }}
          </template>
        </el-table-column>
        
        <el-table-column prop="updatedAt" label="最后更新" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="openProduct(row)"
            >
              继续编辑
            </el-button>
            <el-dropdown @click.stop>
              <el-button size="small" :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editProduct(row)">
                    <el-icon><Edit /></el-icon>
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item @click="duplicateProduct(row)">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportProduct(row)">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item
                    @click="deleteProduct(row)"
                    divided
                    style="color: var(--el-color-danger)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <EmptyState
        v-else
        title="还没有创建任何产品"
        description="开始创建您的第一个PRD项目"
        action-text="创建产品"
        @action="createProduct"
      />
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 分页 -->
    <div v-if="!loading && totalCount > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Grid,
  List,
  More,
  Edit,
  CopyDocument,
  Download,
  Delete
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { productAPI } from '@/services/api/product'
import ProductCard from '../components/ProductCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()

// 列表数据
const products = ref([])
const loading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 搜索和筛选
const searchQuery = ref('')
const filterStatus = ref('')
const sortBy = ref('updatedAt')
const viewMode = ref(localStorage.getItem('product-view-mode') || 'grid')

// 计算属性
const canCreateMore = computed(() => {
  const limit = authStore.user?.subscription?.maxProducts || 3
  return products.value.length < limit
})

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 格式化日期
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// 加载产品列表
const loadProducts = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      status: filterStatus.value,
      sortBy: sortBy.value,
      order: sortBy.value === 'name' ? 'asc' : 'desc'
    }
    
    const response = await productAPI.getList(params)
    
    if (response.success) {
      products.value = response.data.products
      totalCount.value = response.data.total
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
    ElMessage.error('加载产品列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理（防抖）
const handleSearch = debounce(() => {
  currentPage.value = 1
  loadProducts()
}, 300)

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  loadProducts()
}

// 排序处理
const handleSort = () => {
  loadProducts()
}

// 分页处理
const handlePageChange = () => {
  loadProducts()
}

const handleSizeChange = () => {
  currentPage.value = 1
  loadProducts()
}

// 创建产品
const createProduct = () => {
  if (!canCreateMore.value) {
    const limit = authStore.user?.subscription?.maxProducts || 3
    ElMessage.warning(`当前套餐最多创建 ${limit} 个产品，请升级套餐`)
    return
  }
  router.push('/products/create')
}

// 打开产品
const openProduct = (product) => {
  router.push(`/products/${product.id}/chat`)
}

// 编辑产品（重命名）
const editProduct = async (product) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的产品名称', '重命名产品', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: product.name,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '产品名称不能为空'
        }
        if (value.length > 50) {
          return '产品名称不能超过50个字符'
        }
        return true
      }
    })
    
    // 调用API更新
    const response = await productAPI.update(product.id, { name: value })
    
    if (response.success) {
      ElMessage.success('重命名成功')
      loadProducts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重命名失败:', error)
      ElMessage.error('重命名失败')
    }
  }
}

// 复制产品
const duplicateProduct = async (product) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新产品的名称', '复制产品', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: `${product.name} - 副本`,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '产品名称不能为空'
        }
        return true
      }
    })
    
    // 调用API复制
    const response = await productAPI.duplicate(product.id, { newName: value })
    
    if (response.success) {
      ElMessage.success('复制成功')
      loadProducts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制失败:', error)
      ElMessage.error('复制失败')
    }
  }
}

// 导出产品
const exportProduct = (product) => {
  ElMessage.info('导出功能开发中...')
  // TODO: 实现导出功能
}

// 删除产品
const deleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除产品"${product.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API删除
    const response = await productAPI.delete(product.id)
    
    if (response.success) {
      ElMessage.success('删除成功')
      loadProducts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 监听视图模式变化
watch(viewMode, (newMode) => {
  localStorage.setItem('product-view-mode', newMode)
})

// 初始化
onMounted(() => {
  loadProducts()
})
</script>

<style lang="scss" scoped>
.product-list-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .header-left {
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }
    
    .page-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}

.search-card {
  margin-bottom: 24px;
  
  .view-toggle {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

.product-grid {
  margin-bottom: 24px;
}

.list-card {
  margin-bottom: 24px;
  
  .product-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .name {
      font-weight: 500;
      color: var(--text-primary);
    }
  }
}

.loading-container {
  padding: 40px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    
    .header-right {
      width: 100%;
      
      .el-button {
        width: 100%;
      }
    }
  }
  
  .search-card {
    :deep(.el-col) {
      margin-bottom: 12px;
    }
    
    .view-toggle {
      justify-content: center;
    }
  }
}
</style>