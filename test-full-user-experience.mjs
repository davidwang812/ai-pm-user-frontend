import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const API_URL = 'https://aiproductmanager-production.up.railway.app';

// 生成测试数据
const timestamp = Date.now().toString().slice(-6);
const testUsers = {
  // 新用户（应该注册成功）
  newUser: {
    email: `zhangsan${timestamp}@163.com`,
    username: `zhangsan${timestamp}`,
    password: 'Zs123456!@#'
  },
  // 已存在的用户（用于测试重复注册）
  existingUser: {
    email: 'testuser999@example.com',
    username: 'testuser999',
    password: 'testpass123'
  }
};

// 完整的日志收集器
const detailedLogs = {
  console: [],
  errors: [],
  warnings: [],
  network: {
    requests: [],
    responses: [],
    failed: []
  },
  performance: [],
  uiEvents: [],
  testResults: []
};

async function runFullUserExperience() {
  console.log('🎭 Playwright 真人模拟测试');
  console.log('=====================================');
  console.log('🌐 测试环境:', TEST_URL);
  console.log('🔗 API后端:', API_URL);
  console.log('📅 测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,  // 显示浏览器
    slowMo: 300,      // 模拟人类速度
    devtools: true,   // 打开开发者工具
    args: [
      '--disable-blink-features=AutomationControlled',
      '--lang=zh-CN'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    permissions: ['notifications']
  });

  const page = await context.newPage();

  // ========== 全面的事件监听 ==========
  
  // 1. 控制台日志监听
  page.on('console', async msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
      location: msg.location()
    };
    
    detailedLogs.console.push(log);
    
    // 实时输出重要日志
    const typeSymbol = {
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'log': '📝'
    };
    
    const symbol = typeSymbol[msg.type()] || '📌';
    
    if (msg.type() === 'error') {
      detailedLogs.errors.push(log);
      console.log(`${symbol} [Console Error] ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      detailedLogs.warnings.push(log);
      console.log(`${symbol} [Console Warning] ${msg.text()}`);
    }
  });

  // 2. 页面错误监听
  page.on('pageerror', error => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    };
    detailedLogs.errors.push(errorLog);
    console.log(`💥 [Page Error] ${error.message}`);
  });

  // 3. 网络请求监听
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const requestLog = {
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData(),
        time: new Date().toISOString()
      };
      detailedLogs.network.requests.push(requestLog);
      console.log(`📤 [${request.method()}] ${url.replace(API_URL, '[API]')}`);
    }
  });

  // 4. 网络响应监听
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      const responseLog = {
        status: status,
        url: url,
        headers: response.headers(),
        time: new Date().toISOString()
      };
      
      try {
        const body = await response.text();
        if (body) {
          responseLog.body = JSON.parse(body);
        }
      } catch (e) {}
      
      detailedLogs.network.responses.push(responseLog);
      
      const statusSymbol = status < 300 ? '✅' : status < 400 ? '🔄' : '❌';
      console.log(`📥 [${status}] ${statusSymbol} ${url.replace(API_URL, '[API]')}`);
      
      if (responseLog.body && status >= 400) {
        console.log(`   错误消息: ${responseLog.body.message || '未知错误'}`);
      }
    }
  });

  // 5. 请求失败监听
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      time: new Date().toISOString()
    };
    detailedLogs.network.failed.push(failure);
    console.log(`❌ [Request Failed] ${request.method()} ${request.url()}`);
    if (request.failure()) {
      console.log(`   原因: ${request.failure().errorText}`);
    }
  });

  // 6. 性能监控
  page.on('load', async () => {
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });
    detailedLogs.performance.push(metrics);
    console.log(`⚡ 页面加载: DOM=${metrics.domContentLoaded}ms, Total=${metrics.loadComplete}ms`);
  });

  try {
    // ========== 测试场景1: 重复注册测试 ==========
    console.log('\n🧪 测试场景1: 测试重复注册的用户体验');
    console.log('─'.repeat(50));
    
    await page.goto(`${TEST_URL}/register`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('📍 已进入注册页面');
    await page.waitForTimeout(1000);
    
    // 截图：注册页面
    await page.screenshot({
      path: join(__dirname, 'screenshots', `register-page-${timestamp}.png`),
      fullPage: true
    });
    
    // 填写已存在用户的信息
    console.log('📝 填写已存在的用户信息...');
    
    // 逐字输入邮箱（模拟真人）
    const emailInput = await page.locator('input[type="email"]').first();
    await emailInput.click();
    for (const char of testUsers.existingUser.email) {
      await page.keyboard.type(char);
      await page.waitForTimeout(30 + Math.random() * 30);
    }
    console.log(`   ✅ 邮箱: ${testUsers.existingUser.email}`);
    
    // Tab触发自动填充
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // 输入用户名
    const usernameInput = await page.locator('input[placeholder*="用户名"]').first();
    await usernameInput.clear();
    for (const char of testUsers.existingUser.username) {
      await page.keyboard.type(char);
      await page.waitForTimeout(20 + Math.random() * 20);
    }
    console.log(`   ✅ 用户名: ${testUsers.existingUser.username}`);
    
    // 输入密码
    const passwordInputs = await page.locator('input[type="password"]').all();
    for (const input of passwordInputs) {
      await input.click();
      await input.fill(testUsers.existingUser.password);
    }
    console.log(`   ✅ 密码已填写`);
    
    // 勾选协议
    await page.click('.el-checkbox');
    console.log(`   ✅ 已勾选用户协议`);
    
    // 提交注册
    console.log('\n📮 提交注册（预期失败）...');
    const registerButton = await page.locator('button:has-text("注册")').first();
    
    // 监听提示消息
    const messagePromise = page.waitForSelector('.el-message', { timeout: 5000 });
    
    await registerButton.click();
    
    try {
      await messagePromise;
      
      // 获取提示消息
      const messages = await page.evaluate(() => {
        const msgs = [];
        document.querySelectorAll('.el-message').forEach(el => {
          const isWarning = el.className.includes('warning');
          const isError = el.className.includes('error');
          const isSuccess = el.className.includes('success');
          
          msgs.push({
            type: isWarning ? 'warning' : isError ? 'error' : isSuccess ? 'success' : 'info',
            text: el.textContent.trim(),
            color: window.getComputedStyle(el).backgroundColor
          });
        });
        return msgs;
      });
      
      if (messages.length > 0) {
        console.log('\n📋 用户看到的提示:');
        messages.forEach(msg => {
          const icon = msg.type === 'warning' ? '⚠️' : msg.type === 'error' ? '❌' : '✅';
          console.log(`   ${icon} [${msg.type}] ${msg.text}`);
          detailedLogs.testResults.push({
            test: '重复注册提示',
            result: msg.type === 'warning' ? 'PASS' : 'FAIL',
            message: msg.text
          });
        });
      }
    } catch (e) {
      console.log('   ⚠️ 未检测到提示消息');
    }
    
    await page.waitForTimeout(2000);
    
    // 截图：显示错误提示
    await page.screenshot({
      path: join(__dirname, 'screenshots', `duplicate-register-${timestamp}.png`),
      fullPage: true
    });
    
    // ========== 测试场景2: 成功注册新用户 ==========
    console.log('\n🧪 测试场景2: 注册新用户');
    console.log('─'.repeat(50));
    
    // 清空表单重新填写
    console.log('📝 填写新用户信息...');
    
    await emailInput.clear();
    await emailInput.fill(testUsers.newUser.email);
    console.log(`   ✅ 新邮箱: ${testUsers.newUser.email}`);
    
    await usernameInput.clear();
    await usernameInput.fill(testUsers.newUser.username);
    console.log(`   ✅ 新用户名: ${testUsers.newUser.username}`);
    
    // 密码不需要改，但确保填写
    for (const input of passwordInputs) {
      await input.clear();
      await input.fill(testUsers.newUser.password);
    }
    console.log(`   ✅ 密码已更新`);
    
    // 再次提交
    console.log('\n📮 提交新用户注册...');
    
    const [registerResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/register')),
      registerButton.click()
    ]);
    
    const registerStatus = registerResponse.status();
    console.log(`   响应状态: ${registerStatus}`);
    
    if (registerStatus === 201 || registerStatus === 200) {
      console.log('   ✅ 注册成功！');
      detailedLogs.testResults.push({
        test: '新用户注册',
        result: 'PASS',
        message: '成功创建新用户'
      });
      
      // 等待页面跳转
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('dashboard')) {
        console.log('   ✅ 已自动登录并跳转到仪表板');
      } else if (currentUrl.includes('login')) {
        console.log('   ℹ️ 已跳转到登录页');
      }
    } else {
      console.log('   ❌ 注册失败');
      detailedLogs.testResults.push({
        test: '新用户注册',
        result: 'FAIL',
        message: '注册失败'
      });
    }
    
    // ========== 测试场景3: 登录测试 ==========
    console.log('\n🧪 测试场景3: 用户登录');
    console.log('─'.repeat(50));
    
    // 如果不在登录页，导航到登录页
    if (!page.url().includes('login')) {
      await page.goto(`${TEST_URL}/login`, {
        waitUntil: 'networkidle'
      });
    }
    
    console.log('📍 已进入登录页面');
    
    // 填写登录信息
    console.log('📝 填写登录信息...');
    
    const loginEmailInput = await page.locator('input[type="email"]').first();
    await loginEmailInput.clear();
    await loginEmailInput.fill(testUsers.newUser.email);
    console.log(`   ✅ 邮箱: ${testUsers.newUser.email}`);
    
    const loginPasswordInput = await page.locator('input[type="password"]').first();
    await loginPasswordInput.clear();
    await loginPasswordInput.fill(testUsers.newUser.password);
    console.log(`   ✅ 密码已填写`);
    
    // 提交登录
    console.log('\n📮 提交登录...');
    const loginButton = await page.locator('button:has-text("登录"), button:has-text("登入")').first();
    
    const [loginResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
      loginButton.click()
    ]);
    
    const loginStatus = loginResponse.status();
    console.log(`   响应状态: ${loginStatus}`);
    
    if (loginStatus === 200) {
      console.log('   ✅ 登录成功！');
      detailedLogs.testResults.push({
        test: '用户登录',
        result: 'PASS',
        message: '登录成功'
      });
      
      await page.waitForTimeout(3000);
      const dashboardUrl = page.url();
      
      if (dashboardUrl.includes('dashboard')) {
        console.log('   ✅ 成功进入仪表板');
        
        // 截图：仪表板
        await page.screenshot({
          path: join(__dirname, 'screenshots', `dashboard-${timestamp}.png`),
          fullPage: true
        });
      }
    } else {
      console.log('   ❌ 登录失败');
      detailedLogs.testResults.push({
        test: '用户登录',
        result: 'FAIL',
        message: '登录失败'
      });
    }
    
    // ========== 分析报告 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试分析报告');
    console.log('='.repeat(60));
    
    // 1. 测试结果总结
    console.log('\n✅ 测试结果:');
    detailedLogs.testResults.forEach(result => {
      const icon = result.result === 'PASS' ? '✅' : '❌';
      console.log(`   ${icon} ${result.test}: ${result.message}`);
    });
    
    // 2. 控制台日志分析
    console.log('\n📋 控制台日志统计:');
    console.log(`   总日志数: ${detailedLogs.console.length}`);
    console.log(`   错误: ${detailedLogs.errors.length}`);
    console.log(`   警告: ${detailedLogs.warnings.length}`);
    
    if (detailedLogs.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      detailedLogs.errors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message || error.text}`);
      });
    }
    
    // 3. 网络请求分析
    console.log('\n🌐 网络请求统计:');
    console.log(`   API请求: ${detailedLogs.network.requests.length}`);
    console.log(`   API响应: ${detailedLogs.network.responses.length}`);
    console.log(`   失败请求: ${detailedLogs.network.failed.length}`);
    
    // 分析响应状态
    const statusCodes = {};
    detailedLogs.network.responses.forEach(resp => {
      statusCodes[resp.status] = (statusCodes[resp.status] || 0) + 1;
    });
    
    console.log('\n📊 响应状态分布:');
    Object.entries(statusCodes).forEach(([status, count]) => {
      const symbol = status < 300 ? '✅' : status < 400 ? '🔄' : '❌';
      console.log(`   ${symbol} ${status}: ${count}次`);
    });
    
    // 4. 性能分析
    if (detailedLogs.performance.length > 0) {
      const avgLoad = detailedLogs.performance.reduce((sum, p) => sum + p.loadComplete, 0) / detailedLogs.performance.length;
      console.log('\n⚡ 性能指标:');
      console.log(`   平均加载时间: ${Math.round(avgLoad)}ms`);
      console.log(`   页面加载次数: ${detailedLogs.performance.length}`);
    }
    
    // 5. 用户体验评估
    console.log('\n🎯 用户体验评估:');
    
    const hasWarningForDuplicate = detailedLogs.testResults.some(r => 
      r.test === '重复注册提示' && r.result === 'PASS'
    );
    
    console.log(`   重复注册提示: ${hasWarningForDuplicate ? '✅ 友好提示' : '❌ 需要改进'}`);
    console.log(`   错误处理: ${detailedLogs.errors.length === 0 ? '✅ 无错误' : '⚠️ 存在错误'}`);
    console.log(`   页面加载: ${detailedLogs.performance.length > 0 ? '✅ 正常' : '⚠️ 未检测到'}`);
    
    // 保持浏览器打开
    console.log('\n⏸️ 浏览器保持打开15秒以便查看...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    console.error(error.stack);
    
    // 错误截图
    await page.screenshot({
      path: join(__dirname, 'screenshots', `error-${timestamp}.png`),
      fullPage: true
    });
  } finally {
    // 保存详细日志
    const fs = await import('fs');
    const logFile = `test-logs-${timestamp}.json`;
    fs.writeFileSync(
      join(__dirname, logFile),
      JSON.stringify(detailedLogs, null, 2)
    );
    console.log(`\n📁 详细日志已保存: ${logFile}`);
    
    await browser.close();
    console.log('\n🎬 测试完成');
  }
}

// 创建截图目录
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(__dirname, 'screenshots'), { recursive: true });
} catch (e) {}

// 运行测试
console.log('🚀 启动测试...\n');
runFullUserExperience().catch(console.error);