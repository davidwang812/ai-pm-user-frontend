// 测试数据管理
export const testData = {
  // 测试用户
  users: {
    valid: {
      email: 'test@example.com',
      password: 'Test123456!',
      username: 'testuser'
    },
    admin: {
      email: 'admin@example.com',
      password: 'Admin123456!',
      username: 'admin'
    },
    new: () => ({
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456!',
      username: `user_${Date.now()}`
    })
  },

  // 产品数据
  products: {
    basic: {
      name: '智能助手',
      description: '基于AI的智能助手产品',
      targetUsers: '企业用户',
      coreFeatures: '自然语言处理\n智能问答\n多语言支持',
      businessModel: '订阅制',
      competitiveAdvantage: '技术领先，用户体验优秀'
    },
    ecommerce: {
      name: '电商管理系统',
      description: '一站式电商管理解决方案',
      targetUsers: '中小型电商卖家',
      coreFeatures: '库存管理\n订单处理\n数据分析\n营销工具',
      businessModel: 'SaaS',
      competitiveAdvantage: '功能全面，易于使用'
    },
    new: () => ({
      name: `测试产品_${Date.now()}`,
      description: '自动化测试创建的产品',
      targetUsers: '测试用户',
      coreFeatures: '功能1\n功能2\n功能3',
      businessModel: '订阅制',
      competitiveAdvantage: '测试优势'
    })
  },

  // AI对话测试数据
  aiChats: {
    greetings: [
      '你好',
      '你好，请介绍一下自己',
      'Hello, who are you?'
    ],
    questions: [
      '今天天气怎么样？',
      '帮我写一个Python函数',
      '解释一下什么是人工智能'
    ],
    prdRequests: [
      '帮我生成一个社交应用的PRD',
      '我想做一个在线教育平台，帮我写需求文档',
      '创建一个健身应用的产品需求文档'
    ]
  },

  // 验证规则
  validation: {
    email: {
      valid: [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.com'
      ],
      invalid: [
        'notanemail',
        'user@',
        '@example.com',
        'user @example.com'
      ]
    },
    password: {
      valid: [
        'Test123456!',
        'SecurePass123!',
        'MyP@ssw0rd'
      ],
      invalid: [
        '123',
        'password',
        'PASSWORD',
        '12345678',
        'Test123'  // 缺少特殊字符
      ]
    }
  },

  // 错误消息
  errorMessages: {
    required: {
      email: '请输入邮箱',
      password: '请输入密码',
      username: '请输入用户名',
      productName: '请输入产品名称'
    },
    format: {
      email: '请输入有效的邮箱地址',
      password: '密码必须包含大小写字母、数字和特殊字符'
    },
    auth: {
      invalidCredentials: '用户名或密码错误',
      userNotFound: '用户不存在',
      emailExists: '邮箱已被注册'
    }
  },

  // 等待时间配置
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000,
    veryLong: 30000
  },

  // API端点
  endpoints: {
    auth: {
      login: '/api/user/auth/login',
      register: '/api/user/auth/register',
      logout: '/api/user/auth/logout',
      refresh: '/api/user/auth/refresh'
    },
    products: {
      list: '/api/products',
      create: '/api/products',
      update: '/api/products/:id',
      delete: '/api/products/:id'
    },
    ai: {
      chat: '/api/ai/chat',
      generatePRD: '/api/ai/generate-prd',
      status: '/api/ai/status'
    }
  }
};

// 测试环境配置
export const testConfig = {
  environments: {
    local: {
      baseUrl: 'http://localhost:5173',
      apiUrl: 'http://localhost:3000'
    },
    dev: {
      baseUrl: 'https://dev.ai-pm-user.vercel.app',
      apiUrl: 'https://dev.aiproductmanager.up.railway.app'
    },
    production: {
      baseUrl: 'https://ai-pm-user-frontend.vercel.app',
      apiUrl: 'https://aiproductmanager-production.up.railway.app'
    }
  },
  
  // 获取当前环境配置
  getCurrentEnv() {
    const env = process.env.TEST_ENV || 'production';
    return this.environments[env] || this.environments.production;
  }
};

// 测试工具函数
export const testUtils = {
  // 生成随机字符串
  randomString(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  // 生成唯一邮箱
  uniqueEmail(prefix = 'test') {
    return `${prefix}_${Date.now()}_${this.randomString(4)}@example.com`;
  },

  // 生成唯一用户名
  uniqueUsername(prefix = 'user') {
    return `${prefix}_${Date.now()}_${this.randomString(4)}`;
  },

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 格式化日期
  formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
  },

  // 生成测试产品数据
  generateProduct(overrides = {}) {
    return {
      ...testData.products.new(),
      ...overrides
    };
  },

  // 生成测试用户数据
  generateUser(overrides = {}) {
    return {
      email: this.uniqueEmail(),
      password: 'Test123456!',
      username: this.uniqueUsername(),
      ...overrides
    };
  }
};

export default {
  testData,
  testConfig,
  testUtils
};