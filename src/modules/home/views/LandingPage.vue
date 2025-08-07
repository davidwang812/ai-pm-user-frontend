<template>
  <div class="landing-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container">
        <div class="nav-wrapper">
          <div class="logo">
            <img src="@/assets/images/logo.png" alt="Logo" />
            <span>AI产品经理</span>
          </div>
          <div class="nav-actions">
            <router-link to="/login" class="btn-login">登录</router-link>
            <router-link to="/register" class="btn-register">免费注册</router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- Hero 区域 -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              用AI重新定义
              <span class="gradient-text">产品管理</span>
            </h1>
            <p class="hero-subtitle">
              智能PRD生成、需求分析、竞品研究，让产品经理工作效率提升10倍
            </p>
            <div class="hero-actions">
              <router-link to="/register" class="btn btn-primary btn-large">
                立即免费体验
              </router-link>
              <a href="#features" class="btn btn-outline btn-large">
                了解更多
              </a>
            </div>
          </div>
          <div class="hero-image">
            <div class="placeholder-image">
              <i class="el-icon-data-analysis"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- 功能特性 -->
      <section id="features" class="features">
        <div class="container">
          <h2 class="section-title">核心功能</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="el-icon-document"></i>
              </div>
              <h3>智能PRD生成</h3>
              <p>基于最佳实践，自动生成专业的产品需求文档</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <i class="el-icon-chat-dot-round"></i>
              </div>
              <h3>AI对话助手</h3>
              <p>随时随地与AI助手讨论产品方案和设计思路</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <i class="el-icon-data-analysis"></i>
              </div>
              <h3>竞品分析</h3>
              <p>快速分析竞品特性，洞察市场机会</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <i class="el-icon-connection"></i>
              </div>
              <h3>用户故事地图</h3>
              <p>可视化用户旅程，构建完整的产品体验</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 定价方案 -->
      <section class="pricing">
        <div class="container">
          <h2 class="section-title">选择适合您的方案</h2>
          <div class="pricing-grid">
            <div class="pricing-card">
              <h3>免费版</h3>
              <div class="price">
                <span class="amount">￥0</span>
                <span class="period">/月</span>
              </div>
              <ul class="features-list">
                <li>每月100次AI对话</li>
                <li>基础PRD模板</li>
                <li>1个产品项目</li>
                <li>社区支持</li>
              </ul>
              <router-link to="/register" class="btn btn-outline">
                立即开始
              </router-link>
            </div>
            <div class="pricing-card featured">
              <div class="badge">推荐</div>
              <h3>专业版</h3>
              <div class="price">
                <span class="amount">￥99</span>
                <span class="period">/月</span>
              </div>
              <ul class="features-list">
                <li>无限AI对话</li>
                <li>高级PRD模板</li>
                <li>无限产品项目</li>
                <li>优先技术支持</li>
                <li>数据导出功能</li>
              </ul>
              <router-link to="/register" class="btn btn-primary">
                立即开始
              </router-link>
            </div>
            <div class="pricing-card">
              <h3>企业版</h3>
              <div class="price">
                <span class="amount">定制</span>
              </div>
              <ul class="features-list">
                <li>所有专业版功能</li>
                <li>私有化部署</li>
                <li>团队协作</li>
                <li>API接入</li>
                <li>专属客户经理</li>
              </ul>
              <a href="mailto:contact@aipm.com" class="btn btn-outline">
                联系我们
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta">
        <div class="container">
          <h2>准备好提升您的产品管理效率了吗？</h2>
          <p>立即注册，免费体验AI产品经理的强大功能</p>
          <router-link to="/register" class="btn btn-primary btn-large">
            免费开始
          </router-link>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 AI产品经理. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })
})
</script>

<style lang="scss" scoped>
.landing-page {
  min-height: 100vh;
  background: #f5f7fa;
}

// 头部导航
.header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .nav-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    
    img {
      height: 32px;
    }
  }
  
  .nav-actions {
    display: flex;
    gap: 1rem;
    
    .btn-login {
      padding: 0.5rem 1.5rem;
      color: #333;
      text-decoration: none;
      
      &:hover {
        color: #409eff;
      }
    }
    
    .btn-register {
      padding: 0.5rem 1.5rem;
      background: #409eff;
      color: #fff;
      border-radius: 4px;
      text-decoration: none;
      
      &:hover {
        background: #66b1ff;
      }
    }
  }
}

// 容器
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

// Hero 区域
.hero {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
  }
  
  .hero-title {
    font-size: 3rem;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
  
  .gradient-text {
    background: linear-gradient(45deg, #ffd89b, #19547b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .hero-actions {
    display: flex;
    gap: 1rem;
  }
  
  .placeholder-image {
    width: 100%;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    i {
      font-size: 8rem;
      opacity: 0.3;
    }
  }
}

// 按钮样式
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
  
  &.btn-primary {
    background: #409eff;
    color: #fff;
    
    &:hover {
      background: #66b1ff;
    }
  }
  
  &.btn-outline {
    background: transparent;
    color: #fff;
    border: 2px solid #fff;
    
    &:hover {
      background: #fff;
      color: #667eea;
    }
  }
  
  &.btn-large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
}

// 功能特性
.features {
  padding: 4rem 0;
  background: #fff;
  
  .section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }
  
  .feature-card {
    text-align: center;
    padding: 2rem;
    
    .feature-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      i {
        font-size: 2rem;
        color: #fff;
      }
    }
    
    h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    p {
      color: #666;
      line-height: 1.6;
    }
  }
}

// 定价方案
.pricing {
  padding: 4rem 0;
  background: #f5f7fa;
  
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .pricing-card {
    background: #fff;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    position: relative;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    &.featured {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }
    
    .badge {
      position: absolute;
      top: -10px;
      right: 20px;
      background: #f56c6c;
      color: #fff;
      padding: 0.25rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }
    
    h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #333;
    }
    
    .price {
      margin: 1.5rem 0;
      
      .amount {
        font-size: 2.5rem;
        font-weight: bold;
        color: #409eff;
      }
      
      .period {
        color: #999;
      }
    }
    
    .features-list {
      list-style: none;
      padding: 0;
      margin: 2rem 0;
      
      li {
        padding: 0.5rem 0;
        color: #666;
        
        &::before {
          content: '✓';
          color: #67c23a;
          margin-right: 0.5rem;
        }
      }
    }
  }
}

// CTA
.cta {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  text-align: center;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
}

// 页脚
.footer {
  background: #333;
  color: #999;
  padding: 2rem 0;
  text-align: center;
}

// 响应式
@media (max-width: 768px) {
  .hero {
    .container {
      grid-template-columns: 1fr;
    }
    
    .hero-title {
      font-size: 2rem;
    }
    
    .hero-image {
      display: none;
    }
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
    
    .pricing-card.featured {
      transform: none;
    }
  }
}
</style>