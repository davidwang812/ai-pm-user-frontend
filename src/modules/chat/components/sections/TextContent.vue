<template>
  <div class="text-content">
    <div v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Props
const props = defineProps({
  content: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  const html = marked(props.content)
  return DOMPurify.sanitize(html)
})
</script>

<style lang="scss" scoped>
.text-content {
  line-height: 1.8;
  color: #606266;
  
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    color: #303133;
    margin: 24px 0 16px;
    font-weight: 600;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  :deep(p) {
    margin: 0 0 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(ul), :deep(ol) {
    margin: 16px 0;
    padding-left: 24px;
    
    li {
      margin: 8px 0;
    }
  }
  
  :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 20px;
    background-color: #f5f7fa;
    border-left: 4px solid #409eff;
    color: #606266;
    
    p {
      margin: 0;
    }
  }
  
  :deep(code) {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    color: #e6a23c;
  }
  
  :deep(pre) {
    background-color: #f5f7fa;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 16px 0;
    
    code {
      background-color: transparent;
      padding: 0;
      color: #303133;
    }
  }
  
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    
    th, td {
      padding: 12px;
      border: 1px solid #e4e7ed;
      text-align: left;
    }
    
    th {
      background-color: #f5f7fa;
      font-weight: 600;
      color: #303133;
    }
    
    tr:nth-child(even) {
      background-color: #fafbfc;
    }
  }
  
  :deep(a) {
    color: #409eff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 16px auto;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  :deep(hr) {
    margin: 24px 0;
    border: none;
    border-top: 1px solid #e4e7ed;
  }
}
</style>