# AI产品经理用户端 - 自动化测试指南

## 📋 概述

本项目使用Playwright进行E2E自动化测试，支持：
- 🎭 跨浏览器测试（Chrome, Firefox, Safari）
- 📝 YAML格式的测试用例
- 🏗️ Page Object Model架构
- 🤖 CI/CD自动化集成
- 📊 HTML测试报告

## 🚀 快速开始

### 安装依赖
```bash
npm install
npm run test:install  # 安装Playwright浏览器
```

### 运行测试

#### 快速冒烟测试
```bash
npm run test:smoke
```

#### 完整测试套件
```bash
npm run test:full
```

#### 调试模式
```bash
npm run test:debug tests/e2e/specs/auth.spec.js
```

#### UI模式（推荐用于开发）
```bash
npm run test:ui
```

#### 查看测试报告
```bash
npm run test:report
```

## 📁 项目结构

```
tests/
├── e2e/
│   ├── specs/          # 测试规范文件
│   │   └── auth.spec.js
│   ├── pages/          # Page Object Models
│   │   ├── BasePage.js
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   └── HomePage.js
│   ├── fixtures/       # 测试数据
│   └── utils/          # 工具函数
│       └── test-runner.js
├── test-cases/         # YAML测试用例
│   ├── auth/
│   │   ├── login.yml
│   │   └── register.yml
│   └── ai/
│       └── chat.yml
└── test-results/       # 测试结果（自动生成）
```

## 🎯 测试覆盖范围

### 已实现的测试
- ✅ 用户认证（登录、注册、登出）
- ✅ 表单验证
- ✅ 错误处理

### 待实现的测试
- 🔄 AI对话功能
- 🔄 产品管理CRUD
- 🔄 WebSocket实时通信
- 🔄 订阅管理
- 🔄 数据导出

## 📝 编写新测试

### 1. 创建Page Object
```javascript
// tests/e2e/pages/NewPage.js
const BasePage = require('./BasePage');

class NewPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = {
      // 定义选择器
    };
  }
  
  // 实现页面方法
}

module.exports = NewPage;
```

### 2. 编写测试规范
```javascript
// tests/e2e/specs/new-feature.spec.js
const { test, expect } = require('@playwright/test');

test.describe('新功能测试', () => {
  test('测试场景', async ({ page }) => {
    // 测试步骤
  });
});
```

### 3. 创建YAML测试用例
```yaml
# tests/test-cases/feature/new-test.yml
name: "新功能测试"
description: "描述"
scenarios:
  - name: "场景名称"
    steps:
      - "步骤1"
      - "步骤2"
    expected:
      - "预期结果"
```

## 🔧 配置说明

### playwright.config.js
- `baseURL`: 测试目标URL
- `projects`: 浏览器配置
- `reporter`: 报告格式
- `use`: 全局测试选项

### 环境变量
- `TEST_BASE_URL`: 覆盖默认测试URL
- `CI`: CI环境标识

## 🚦 CI/CD集成

项目配置了GitHub Actions自动运行测试：
- Push到main分支时运行
- Pull Request时运行
- 每天定时运行
- 手动触发运行

查看测试结果：
1. GitHub Actions标签页
2. 测试报告artifacts
3. GitHub Pages测试报告（main分支）

## 🐛 调试技巧

### 1. 使用调试模式
```bash
npm run test:debug
```

### 2. 查看测试录像
失败的测试会自动录制视频，保存在`test-results/videos/`

### 3. 截图调试
```javascript
await page.screenshot({ path: 'debug.png' });
```

### 4. 暂停执行
```javascript
await page.pause(); // 在UI模式下暂停
```

## 📊 测试报告

### HTML报告
- 位置：`test-results/html-report/`
- 包含：测试结果、截图、视频、日志

### JSON报告
- 位置：`test-results/test-results.json`
- 用于：CI/CD集成、自定义分析

## 🎨 最佳实践

1. **使用Page Object Model**
   - 提高代码复用性
   - 简化维护工作

2. **数据驱动测试**
   - 使用fixtures管理测试数据
   - 支持多环境配置

3. **选择器策略**
   - 优先使用稳定的选择器
   - 避免使用易变的class或id

4. **等待策略**
   - 使用智能等待而非固定延时
   - 确保元素可见和可交互

5. **错误处理**
   - 添加有意义的错误消息
   - 收集足够的调试信息

## 🆘 常见问题

### 测试超时
- 增加超时时间：`test.setTimeout(60000)`
- 检查网络连接
- 确认元素选择器正确

### 元素未找到
- 使用调试模式检查
- 验证选择器
- 添加等待条件

### 浏览器问题
- 重新安装：`npx playwright install`
- 检查系统依赖
- 使用Docker容器

## 📚 参考资源

- [Playwright官方文档](https://playwright.dev)
- [Page Object Model指南](https://playwright.dev/docs/pom)
- [CI/CD最佳实践](https://playwright.dev/docs/ci)
- [调试技巧](https://playwright.dev/docs/debug)