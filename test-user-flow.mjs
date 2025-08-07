import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const API_URL = 'https://aiproductmanager-production.up.railway.app';

// 生成随机测试数据
const timestamp = Date.now();
const testEmail = `test.user.${timestamp}@example.com`;
const testUsername = `testuser${timestamp}`;
const testPassword = 'Test123456!';

// 控制台日志收集器
const consoleLogs = [];
const networkErrors = [];
const pageErrors = [];

async function runTest() {
  console.log('🚀 启动Playwright测试...');
  console.log(`📧 测试邮箱: ${testEmail}`);
  console.log(`👤 测试用户名: ${testUsername}`);
  console.log(`🔗 测试URL: ${TEST_URL}`);
  console.log('================================\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器便于调试
    slowMo: 500, // 放慢操作速度，模拟真人
    devtools: true // 打开开发者工具
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  // 监听控制台日志
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    
    // 实时显示重要日志
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`🔴 Console ${msg.type()}: ${msg.text()}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    };
    pageErrors.push(errorEntry);
    console.log(`❌ Page Error: ${error.message}`);
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    const failEntry = {
      url: request.url(),
      failure: request.failure(),
      method: request.method(),
      time: new Date().toISOString()
    };
    networkErrors.push(failEntry);
    console.log(`🌐 Request Failed: ${request.method()} ${request.url()}`);
    if (request.failure()) {
      console.log(`   Reason: ${request.failure().errorText}`);
    }
  });

  // 监听响应
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
    }
    // 记录API调用
    if (response.url().includes('/api/')) {
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // ========== 测试1: 访问首页 ==========
    console.log('\n📍 测试1: 访问首页');
    await page.goto(TEST_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ 首页加载成功');

    // 等待页面完全渲染
    await page.waitForTimeout(2000);

    // 截图首页
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `home-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 测试2: 导航到注册页面 ==========
    console.log('\n📍 测试2: 导航到注册页面');
    
    // 查找注册链接或按钮
    const registerLink = await page.locator('a:has-text("注册"), button:has-text("注册"), a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      console.log('✅ 点击注册链接');
    } else {
      // 直接导航到注册页面
      await page.goto(`${TEST_URL}/register`, { waitUntil: 'networkidle' });
      console.log('✅ 直接导航到注册页面');
    }

    await page.waitForTimeout(2000);

    // ========== 测试3: 填写注册表单 ==========
    console.log('\n📍 测试3: 填写注册表单');

    // 等待表单加载
    await page.waitForSelector('input[type="email"], input[placeholder*="邮箱"], input[data-testid="register-email"]', {
      timeout: 10000
    });

    // 查找邮箱输入框
    const emailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"], input[data-testid="register-email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.click();
      await emailInput.fill(testEmail);
      console.log('✅ 填写邮箱');
      
      // 等待自动填充用户名
      await page.waitForTimeout(1000);
    }

    // 查找用户名输入框
    const usernameInput = await page.locator('input[placeholder*="用户名"], input[data-testid="register-username"]').first();
    if (await usernameInput.isVisible()) {
      // 检查是否已自动填充
      const currentValue = await usernameInput.inputValue();
      console.log(`📝 用户名当前值: ${currentValue}`);
      
      if (!currentValue) {
        await usernameInput.click();
        await usernameInput.fill(testUsername);
      } else {
        // 修改自动填充的用户名
        await usernameInput.click();
        await usernameInput.clear();
        await usernameInput.fill(testUsername);
      }
      console.log('✅ 填写用户名');
    }

    // 查找密码输入框
    const passwordInput = await page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.click();
      await passwordInput.fill(testPassword);
      console.log('✅ 填写密码');
    }

    // 查找确认密码输入框
    const confirmPasswordInput = await page.locator('input[type="password"]').nth(1);
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.click();
      await confirmPasswordInput.fill(testPassword);
      console.log('✅ 填写确认密码');
    }

    // 截图填写完成的表单
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `register-form-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 测试4: 提交注册 ==========
    console.log('\n📍 测试4: 提交注册');

    // 查找提交按钮
    const submitButton = await page.locator('button[type="submit"], button:has-text("注册"), button:has-text("立即注册")').first();
    if (await submitButton.isVisible()) {
      console.log('🔄 点击注册按钮...');
      
      // 监听网络请求
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/') && response.url().includes('register'),
        { timeout: 10000 }
      ).catch(() => null);

      await submitButton.click();
      
      // 等待响应
      const response = await responsePromise;
      if (response) {
        const status = response.status();
        console.log(`📡 注册API响应: ${status}`);
        
        try {
          const body = await response.json();
          console.log('📦 响应数据:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('📦 响应文本:', await response.text());
        }
      }
    }

    // 等待页面跳转或显示消息
    await page.waitForTimeout(3000);

    // 检查是否注册成功
    const currentUrl = page.url();
    console.log(`📍 当前URL: ${currentUrl}`);

    // 截图注册结果
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `register-result-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 测试5: 尝试登录 ==========
    console.log('\n📍 测试5: 尝试登录');

    // 如果注册成功且跳转到了其他页面，尝试登出再登录
    if (!currentUrl.includes('register')) {
      console.log('✅ 注册成功，已跳转');
      
      // 查找登出按钮
      const logoutButton = await page.locator('button:has-text("登出"), button:has-text("退出")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // 导航到登录页面
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 填写登录表单
    const loginEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').first();
    if (await loginEmailInput.isVisible()) {
      await loginEmailInput.click();
      await loginEmailInput.fill(testEmail);
      console.log('✅ 填写登录邮箱');
    }

    const loginPasswordInput = await page.locator('input[type="password"]').first();
    if (await loginPasswordInput.isVisible()) {
      await loginPasswordInput.click();
      await loginPasswordInput.fill(testPassword);
      console.log('✅ 填写登录密码');
    }

    // 提交登录
    const loginButton = await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登入")').first();
    if (await loginButton.isVisible()) {
      console.log('🔄 点击登录按钮...');
      
      const loginResponsePromise = page.waitForResponse(
        response => response.url().includes('/api/') && response.url().includes('login'),
        { timeout: 10000 }
      ).catch(() => null);

      await loginButton.click();
      
      const loginResponse = await loginResponsePromise;
      if (loginResponse) {
        console.log(`📡 登录API响应: ${loginResponse.status()}`);
        
        try {
          const body = await loginResponse.json();
          console.log('📦 登录响应:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('📦 登录响应文本:', await loginResponse.text());
        }
      }
    }

    await page.waitForTimeout(3000);

    // 截图登录结果
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `login-result-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 输出测试总结 ==========
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));

    // 输出控制台日志
    if (consoleLogs.length > 0) {
      console.log('\n📋 控制台日志:');
      consoleLogs.forEach(log => {
        console.log(`  [${log.type}] ${log.text}`);
      });
    }

    // 输出页面错误
    if (pageErrors.length > 0) {
      console.log('\n❌ 页面错误:');
      pageErrors.forEach(error => {
        console.log(`  ${error.message}`);
      });
    }

    // 输出网络错误
    if (networkErrors.length > 0) {
      console.log('\n🌐 网络错误:');
      networkErrors.forEach(error => {
        console.log(`  ${error.method} ${error.url}`);
        if (error.failure) {
          console.log(`    原因: ${error.failure.errorText}`);
        }
      });
    }

    // 等待用户查看
    console.log('\n⏸️ 保持浏览器打开10秒供查看...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    // 错误截图
    try {
      await page.screenshot({ 
        path: join(__dirname, 'screenshots', `error-${timestamp}.png`),
        fullPage: true 
      });
    } catch (e) {}
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

// 创建截图目录
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(__dirname, 'screenshots'), { recursive: true });
} catch (e) {}

// 运行测试
runTest().catch(console.error);