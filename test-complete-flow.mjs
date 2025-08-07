import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const API_URL = 'https://aiproductmanager-production.up.railway.app';

// 生成唯一测试数据
const timestamp = String(Date.now()).slice(-6);
const testData = {
  email: `test${timestamp}@example.com`,
  username: `user${timestamp}`,
  password: 'Test123456!',
  originalUsername: `test${timestamp}` // 邮箱自动填充的用户名
};

// 日志收集器
const logs = {
  console: [],
  errors: [],
  warnings: [],
  network: [],
  performance: []
};

async function runCompleteTest() {
  console.log('🚀 Playwright 完整测试流程');
  console.log('================================');
  console.log(`📧 测试邮箱: ${testData.email}`);
  console.log(`👤 测试用户名: ${testData.username}`);
  console.log(`🔑 测试密码: ${testData.password}`);
  console.log(`🌐 测试URL: ${TEST_URL}`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log('================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    devtools: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    permissions: ['notifications'],
    recordVideo: {
      dir: 'videos/',
      size: { width: 1366, height: 768 }
    }
  });

  const page = await context.newPage();

  // ========== 事件监听器 ==========
  
  // 监听控制台
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
      location: msg.location()
    };
    
    logs.console.push(log);
    
    // 实时输出重要日志
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      logs.errors.push(log);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ Console Warning: ${msg.text()}`);
      logs.warnings.push(log);
    } else if (msg.type() === 'info' || msg.type() === 'log') {
      if (msg.text().includes('API') || msg.text().includes('auth')) {
        console.log(`ℹ️ ${msg.text()}`);
      }
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    };
    logs.errors.push(errorLog);
    console.log(`💥 Page Error: ${error.message}`);
  });

  // 监听请求
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
      logs.network.push({ type: 'request', ...requestLog });
      
      console.log(`📤 API ${request.method()}: ${url}`);
      if (request.postData()) {
        try {
          const data = JSON.parse(request.postData());
          console.log(`   数据:`, data);
        } catch (e) {
          console.log(`   数据: ${request.postData()}`);
        }
      }
    }
  });

  // 监听响应
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
      
      // 尝试获取响应体
      try {
        const body = await response.text();
        if (body) {
          responseLog.body = JSON.parse(body);
        }
      } catch (e) {
        // 忽略解析错误
      }
      
      logs.network.push({ type: 'response', ...responseLog });
      
      console.log(`📥 API响应 ${status}: ${url}`);
      if (responseLog.body) {
        console.log(`   响应:`, responseLog.body);
      }
      
      // 检查错误状态
      if (status >= 400) {
        console.log(`⚠️ API错误: ${status} ${url}`);
      }
    }
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      failure: request.failure(),
      method: request.method(),
      time: new Date().toISOString()
    };
    logs.network.push({ type: 'failed', ...failure });
    console.log(`❌ 请求失败: ${request.method()} ${request.url()}`);
    if (request.failure()) {
      console.log(`   原因: ${request.failure().errorText}`);
    }
  });

  // 监听对话框
  page.on('dialog', async dialog => {
    console.log(`🔔 对话框 [${dialog.type()}]: ${dialog.message()}`);
    await dialog.accept();
  });

  // 性能监控
  page.on('load', async () => {
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });
    logs.performance.push(metrics);
    console.log(`⚡ 页面加载性能: DOMContentLoaded=${metrics.domContentLoaded}ms, Load=${metrics.loadComplete}ms`);
  });

  try {
    // ========== 测试步骤 ==========
    
    // 步骤1: 访问首页
    console.log('\n📍 步骤1: 访问首页');
    await page.goto(TEST_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    const initialUrl = page.url();
    console.log(`   当前URL: ${initialUrl}`);
    
    // 截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `1-home-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤2: 导航到注册页面
    console.log('\n📍 步骤2: 导航到注册页面');
    
    // 直接访问注册页面
    await page.goto(`${TEST_URL}/register`, {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    console.log(`   当前URL: ${page.url()}`);

    // 步骤3: 填写注册表单
    console.log('\n📍 步骤3: 填写注册表单');
    
    // 等待表单加载
    await page.waitForSelector('input[data-testid="register-email"], input[type="email"], input[placeholder*="邮箱"]', {
      timeout: 10000
    });

    // 填写邮箱
    const emailInput = await page.locator('input[data-testid="register-email"], input[type="email"], input[placeholder*="邮箱"]').first();
    await emailInput.click();
    await emailInput.fill(testData.email);
    console.log(`   ✅ 填写邮箱: ${testData.email}`);
    
    // 触发自动填充
    await emailInput.press('Tab');
    await page.waitForTimeout(1000);
    
    // 检查用户名自动填充
    const usernameInput = await page.locator('input[data-testid="register-username"], input[placeholder*="用户名"]').first();
    const autoFilledUsername = await usernameInput.inputValue();
    console.log(`   📝 自动填充用户名: ${autoFilledUsername}`);
    
    // 验证自动填充是否正确
    if (autoFilledUsername === testData.originalUsername) {
      console.log('   ✅ 用户名自动填充正确');
    } else {
      console.log(`   ⚠️ 用户名自动填充不符合预期 (期望: ${testData.originalUsername})`);
    }
    
    // 修改用户名
    await usernameInput.clear();
    await usernameInput.fill(testData.username);
    console.log(`   ✅ 修改用户名为: ${testData.username}`);
    
    // 填写密码
    const passwordInput = await page.locator('input[data-testid="register-password"], input[type="password"]').first();
    await passwordInput.fill(testData.password);
    console.log(`   ✅ 填写密码`);
    
    const confirmPasswordInput = await page.locator('input[data-testid="register-confirm-password"]').first();
    await confirmPasswordInput.fill(testData.password);
    console.log(`   ✅ 填写确认密码`);
    
    // 勾选用户协议
    const checkbox = await page.locator('.el-checkbox, input[type="checkbox"]').first();
    await checkbox.click();
    console.log(`   ✅ 勾选用户协议`);
    
    // 截图填写完成的表单
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `2-register-form-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤4: 提交注册
    console.log('\n📍 步骤4: 提交注册');
    
    // 查找并点击注册按钮
    const registerButton = await page.locator('button[data-testid="register-submit"], button:has-text("注册"), button:has-text("立即注册")').first();
    
    // 设置响应等待
    const [registerResponse] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/auth/register'),
        { timeout: 10000 }
      ).catch(() => null),
      registerButton.click()
    ]);
    
    console.log('   点击注册按钮');
    
    if (registerResponse) {
      const status = registerResponse.status();
      console.log(`   📡 注册响应: ${status}`);
      
      if (status === 200 || status === 201) {
        console.log('   ✅ 注册成功！');
      } else if (status === 409) {
        console.log('   ⚠️ 用户已存在');
      } else {
        console.log('   ❌ 注册失败');
      }
    }
    
    // 等待可能的页面跳转
    await page.waitForTimeout(3000);
    const afterRegisterUrl = page.url();
    console.log(`   注册后URL: ${afterRegisterUrl}`);
    
    // 截图注册结果
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `3-register-result-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤5: 测试登录
    console.log('\n📍 步骤5: 测试登录');
    
    // 检查是否自动登录
    if (afterRegisterUrl.includes('dashboard')) {
      console.log('   ✅ 注册后自动登录成功');
      
      // 登出
      const logoutButton = await page.locator('button:has-text("退出"), button:has-text("登出")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        console.log('   已登出，准备测试登录');
      }
    }
    
    // 导航到登录页
    if (!page.url().includes('login')) {
      await page.goto(`${TEST_URL}/login`);
      await page.waitForTimeout(2000);
    }
    
    // 填写登录表单
    console.log('   填写登录表单...');
    await page.fill('input[type="email"], input[placeholder*="邮箱"]', testData.email);
    console.log(`   ✅ 填写邮箱: ${testData.email}`);
    
    await page.fill('input[type="password"]', testData.password);
    console.log(`   ✅ 填写密码`);
    
    // 提交登录
    const loginButton = await page.locator('button:has-text("登录"), button:has-text("登入")').first();
    
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/auth/login'),
        { timeout: 10000 }
      ).catch(() => null),
      loginButton.click()
    ]);
    
    console.log('   点击登录按钮');
    
    if (loginResponse) {
      const status = loginResponse.status();
      console.log(`   📡 登录响应: ${status}`);
      
      if (status === 200) {
        console.log('   ✅ 登录成功！');
      } else {
        console.log('   ❌ 登录失败');
      }
    }
    
    // 等待页面跳转
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log(`   登录后URL: ${finalUrl}`);
    
    if (finalUrl.includes('dashboard')) {
      console.log('   ✅ 成功进入仪表板！');
    }
    
    // 最终截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `4-final-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 测试总结 ==========
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));
    
    // 控制台日志分析
    console.log('\n📋 控制台日志统计:');
    console.log(`   总计: ${logs.console.length} 条`);
    console.log(`   错误: ${logs.errors.length} 条`);
    console.log(`   警告: ${logs.warnings.length} 条`);
    
    if (logs.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      logs.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message || error.text}`);
      });
    }
    
    // 网络请求分析
    const apiRequests = logs.network.filter(l => l.type === 'request');
    const apiResponses = logs.network.filter(l => l.type === 'response');
    const failedRequests = logs.network.filter(l => l.type === 'failed');
    
    console.log('\n🌐 网络请求统计:');
    console.log(`   API请求: ${apiRequests.length} 个`);
    console.log(`   API响应: ${apiResponses.length} 个`);
    console.log(`   失败请求: ${failedRequests.length} 个`);
    
    // 性能分析
    if (logs.performance.length > 0) {
      console.log('\n⚡ 性能指标:');
      logs.performance.forEach((perf, index) => {
        console.log(`   页面${index + 1}: DOMContentLoaded=${perf.domContentLoaded}ms, Load=${perf.loadComplete}ms`);
      });
    }
    
    // 测试结果
    console.log('\n✅ 测试完成状态:');
    console.log(`   注册功能: ${afterRegisterUrl.includes('dashboard') || registerResponse?.status() === 201 ? '✅ 成功' : '❌ 失败'}`);
    console.log(`   自动填充: ${autoFilledUsername === testData.originalUsername ? '✅ 正常' : '⚠️ 异常'}`);
    console.log(`   登录功能: ${finalUrl.includes('dashboard') ? '✅ 成功' : '❌ 失败'}`);
    
    // 保持浏览器打开以便查看
    console.log('\n⏸️ 浏览器保持打开10秒...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    
    // 错误截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `error-${timestamp}.png`),
      fullPage: true 
    });
  } finally {
    // 保存完整日志
    const fs = await import('fs');
    fs.writeFileSync(
      join(__dirname, `test-logs-${timestamp}.json`),
      JSON.stringify(logs, null, 2)
    );
    console.log(`\n📁 日志已保存: test-logs-${timestamp}.json`);
    
    await browser.close();
    console.log('\n🎬 测试结束');
  }
}

// 创建截图目录
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(__dirname, 'screenshots'), { recursive: true });
  mkdirSync(join(__dirname, 'videos'), { recursive: true });
} catch (e) {}

// 运行测试
runCompleteTest().catch(console.error);