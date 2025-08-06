// router/index.js - 路由配置
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { ElMessage } from 'element-plus'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/auth/views/Login.vue'),
    meta: {
      title: '登录 - AI产品经理',
      public: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/modules/auth/views/Register.vue'),
    meta: {
      title: '注册 - AI产品经理',
      public: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/modules/dashboard/views/Home.vue'),
        meta: {
          title: '工作台 - AI产品经理',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/products',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ProductList',
        component: () => import('@/modules/product/views/ProductList.vue'),
        meta: { title: '我的产品' }
      },
      {
        path: 'create',
        name: 'ProductCreate',
        component: () => import('@/modules/product/views/ProductCreate.vue'),
        meta: { title: '创建产品' }
      },
      {
        path: ':id/chat',
        name: 'AIChat',
        component: () => import('@/modules/chat/views/ChatWorkspace.vue'),
        meta: { title: 'AI对话' }
      },
      {
        path: ':id/prd',
        name: 'PRDPreview',
        component: () => import('@/modules/prd/views/PRDPreview.vue'),
        meta: { title: 'PRD文档' }
      }
    ]
  },
  {
    path: '/subscription',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Subscription',
        component: () => import('@/modules/subscription/views/Subscription.vue'),
        meta: { title: '订阅管理' }
      }
    ]
  },
  {
    path: '/usage',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Usage',
        component: () => import('@/modules/user/views/Usage.vue'),
        meta: { title: '使用统计' }
      }
    ]
  },
  {
    path: '/settings',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Settings',
        component: () => import('@/modules/user/views/Settings.vue'),
        meta: { title: '个人设置' }
      }
    ]
  },
  {
    path: '/export',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Export',
        component: () => import('@/modules/user/views/Export.vue'),
        meta: { title: '数据导出' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/components/common/NotFound.vue'),
    meta: {
      title: '页面未找到',
      public: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 获取认证状态
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = to.meta.title || 'AI产品经理'
  
  // 公开页面直接访问
  if (to.meta.public) {
    // 已登录用户访问登录页，重定向到首页
    if (authStore.isAuthenticated && to.name === 'Login') {
      next('/dashboard')
      return
    }
    next()
    return
  }
  
  // 需要认证的页面
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning('请先登录')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查Token是否过期
    if (authStore.isTokenExpired()) {
      try {
        await authStore.refreshToken()
      } catch (error) {
        ElMessage.error('登录已过期，请重新登录')
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败')
})

export default router