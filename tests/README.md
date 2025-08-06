# AI产品经理 - E2E测试框架指南

## 🎯 测试框架概述

本测试框架基于Claude Code AI测试指南构建，提供全面的端到端自动化测试解决方案。

### 📋 测试架构

```
tests/
├── e2e/                      # E2E测试
│   ├── pages/               # Page Object Models
│   ├── specs/               # 测试规范
│   ├── test-cases/          # YAML测试用例
│   └── utils/               # 工具函数
├── dashboard/               # 测试仪表板
└── reports/                 # 测试报告
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
npx playwright install
```

### 2. 运行测试

#### 运行所有测试
```bash
npm test
```

#### 运行特定测试套件
```bash
npm run test:auth      # 认证测试
npm run test:ai        # AI功能测试
npm run test:product   # 产品管理测试
npm run test:websocket # WebSocket测试
npm run test:performance # 性能测试
```

#### 调试模式
```bash
npm run test:debug     # 带UI的调试模式
npm run test:ui        # Playwright UI模式
```

### 3. 查看测试报告
```bash
npm run test:report    # 打开HTML报告
npm run test:dashboard # 打开测试仪表板
```

## 📊 测试覆盖范围

### 功能测试
- ✅ 用户认证（注册/登录/登出）
- ✅ AI对话功能
- ✅ 产品管理CRUD
- ✅ 实时消息推送
- ✅ 文件上传下载
- ✅ 权限控制

### 性能测试
- ✅ 页面加载时间
- ✅ API响应时间
- ✅ Core Web Vitals
- ✅ 内存泄漏检测
- ✅ 并发用户测试
- ✅ 缓存效率

### WebSocket测试
- ✅ 连接建立与重连
- ✅ 实时消息传输
- ✅ 离线消息队列
- ✅ 多用户协作
- ✅ 消息延迟测试

## 🛠️ 测试配置

### 环境变量
```bash
# .env.test
TEST_BASE_URL=https://ai-pm-user-frontend.vercel.app
TEST_API_URL=https://ai-product-manager-production.up.railway.app
TEST_TIMEOUT=30000
TEST_RETRY=2
```

### 浏览器配置
- Chrome (默认)
- Firefox
- Safari
- Mobile Chrome
- Mobile Safari

## 📝 编写新测试

### 1. 创建Page Object
```javascript
// tests/e2e/pages/NewPage.js
import BasePage from './BasePage.js';

class NewPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/#/new-page';
    this.elements = {
      title: '.page-title',
      button: '.action-button'
    };
  }
  
  async doSomething() {
    await this.click(this.elements.button);
  }
}

export default NewPage;
```

### 2. 编写测试规范
```javascript
// tests/e2e/specs/new-feature.spec.js
import { test, expect } from '@playwright/test';
import NewPage from '../pages/NewPage.js';

test.describe('新功能测试', () => {
  test('基本功能', async ({ page }) => {
    const newPage = new NewPage(page);
    await newPage.navigate();
    await newPage.doSomething();
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### 3. 创建YAML测试用例
```yaml
# tests/e2e/test-cases/new-feature.yaml
name: 新功能测试用例
description: 测试新功能的各种场景
cases:
  - name: 正常流程
    steps:
      - action: navigate
        target: /#/new-page
      - action: click
        target: .action-button
      - action: assert
        target: .result
        expected: visible
```

## 🔧 CI/CD集成

### GitHub Actions
测试会在以下情况自动运行：
- Push到main分支
- 创建Pull Request
- 每天定时执行（可选）

### 查看CI结果
1. 访问GitHub Actions页面
2. 查看测试运行历史
3. 下载测试报告artifacts

## 📈 测试指标

### 关键指标
- **测试通过率**: 目标 > 95%
- **测试覆盖率**: 目标 > 80%
- **平均执行时间**: < 10分钟
- **不稳定测试**: < 5%

### 性能基准
- 页面加载: < 3秒
- API响应: < 2秒
- WebSocket延迟: < 100ms
- 内存使用: < 200MB

## 🐛 常见问题

### 1. 测试超时
- 增加超时时间: `TEST_TIMEOUT=60000`
- 检查网络连接
- 验证测试环境可访问

### 2. 元素找不到
- 使用更具体的选择器
- 添加等待条件
- 检查页面是否完全加载

### 3. 认证失败
- 验证测试账号有效
- 检查API端点正确
- 确认token未过期

## 📚 最佳实践

1. **保持测试独立**: 每个测试应该能单独运行
2. **使用Page Object**: 封装页面逻辑，提高可维护性
3. **合理使用等待**: 优先使用智能等待而非固定延时
4. **数据清理**: 测试后清理创建的数据
5. **并行执行**: 利用Playwright的并行能力
6. **持续监控**: 定期检查测试健康度

## 🔗 相关资源

- [Playwright文档](https://playwright.dev/)
- [Claude Code AI测试指南](../../../claude_code_ai_testing_guide.md)
- [项目文档](../../../docs/README.md)
- [API文档](../../../docs/api/README.md)

## 📞 支持

如有问题，请：
1. 查看测试日志
2. 检查错误截图
3. 联系开发团队