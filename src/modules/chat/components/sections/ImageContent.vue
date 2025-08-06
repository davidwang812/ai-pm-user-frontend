<template>
  <div class="image-content">
    <!-- 单张图片 -->
    <div v-if="!isMultiple" class="single-image">
      <el-image
        :src="imageUrl"
        :alt="metadata.alt || '产品图片'"
        fit="contain"
        :preview-src-list="[imageUrl]"
        @error="handleError"
      >
        <template #error>
          <div class="image-error">
            <el-icon :size="48"><Picture /></el-icon>
            <span>图片加载失败</span>
          </div>
        </template>
      </el-image>
      <p v-if="metadata.caption" class="image-caption">{{ metadata.caption }}</p>
    </div>
    
    <!-- 多张图片 -->
    <div v-else class="multiple-images">
      <el-row :gutter="16">
        <el-col
          v-for="(image, index) in images"
          :key="index"
          :xs="24"
          :sm="12"
          :md="8"
        >
          <div class="image-item">
            <el-image
              :src="image.url"
              :alt="image.alt || `图片${index + 1}`"
              fit="cover"
              :preview-src-list="previewList"
              :initial-index="index"
              @error="handleError"
            >
              <template #error>
                <div class="image-error">
                  <el-icon :size="32"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图片说明 -->
    <div v-if="metadata.description" class="image-description">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ metadata.description }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  content: {
    type: [String, Array, Object],
    required: true
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// 判断是否多图
const isMultiple = computed(() => {
  return Array.isArray(props.content) || 
         (typeof props.content === 'object' && props.content.images)
})

// 单图URL
const imageUrl = computed(() => {
  if (typeof props.content === 'string') {
    return props.content
  }
  if (typeof props.content === 'object' && props.content.url) {
    return props.content.url
  }
  return ''
})

// 多图数组
const images = computed(() => {
  if (Array.isArray(props.content)) {
    return props.content.map(item => {
      if (typeof item === 'string') {
        return { url: item }
      }
      return item
    })
  }
  if (typeof props.content === 'object' && props.content.images) {
    return props.content.images
  }
  return []
})

// 预览列表
const previewList = computed(() => {
  return images.value.map(img => img.url)
})

// 处理图片加载错误
const handleError = () => {
  console.error('图片加载失败')
}
</script>

<style lang="scss" scoped>
.image-content {
  .single-image {
    text-align: center;
    
    .el-image {
      max-width: 100%;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  .multiple-images {
    .image-item {
      margin-bottom: 16px;
      
      .el-image {
        width: 100%;
        height: 200px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.3s ease;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }
  
  .image-caption {
    margin-top: 12px;
    font-size: 14px;
    color: #909399;
    text-align: center;
    font-style: italic;
  }
  
  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
    color: #c0c4cc;
    
    span {
      margin-top: 8px;
      font-size: 14px;
    }
  }
  
  .image-description {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    color: #909399;
    font-size: 14px;
    
    .el-icon {
      font-size: 16px;
      color: #409eff;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .image-content {
    .multiple-images {
      .image-item {
        .el-image {
          height: 150px;
        }
      }
    }
  }
}
</style>