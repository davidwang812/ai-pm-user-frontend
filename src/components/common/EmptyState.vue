<template>
  <div class="empty-state">
    <div class="empty-icon">
      <el-icon :size="80" :color="iconColor">
        <component :is="icon" />
      </el-icon>
    </div>
    
    <h3 class="empty-title">{{ title }}</h3>
    
    <p class="empty-description" v-if="description">
      {{ description }}
    </p>
    
    <div class="empty-actions" v-if="actionText || $slots.action">
      <slot name="action">
        <el-button
          type="primary"
          size="large"
          @click="handleAction"
        >
          {{ actionText }}
        </el-button>
      </slot>
    </div>
    
    <div class="empty-extra" v-if="$slots.extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
import { FolderOpened } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: FolderOpened
  },
  iconColor: {
    type: String,
    default: '#909399'
  },
  actionText: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['action'])

// 处理动作
const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.empty-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px;
  max-width: 400px;
  line-height: 1.5;
}

.empty-actions {
  margin-bottom: 24px;
}

.empty-extra {
  width: 100%;
  max-width: 600px;
}

// 响应式设计
@media (max-width: 768px) {
  .empty-state {
    padding: 40px 20px;
    min-height: 300px;
  }
  
  .empty-icon {
    :deep(.el-icon) {
      font-size: 60px !important;
    }
  }
  
  .empty-title {
    font-size: 18px;
  }
  
  .empty-description {
    font-size: 14px;
  }
}
</style>