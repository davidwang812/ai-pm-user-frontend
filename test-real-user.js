// 真人模拟测试 - 登录和注册功能
const { chromium } = require('playwright');

async function simulateRealUser() {
  console.log('🎭 启动真人模拟测试...\n');
  
  const browser = await chromium.launch({
    headless: false, // 显示浏览器
    slowMo: 100, // 模拟真人操作速度
    devtools: true // 打开开发者工具
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 收集控制台日志
  const consoleLogs = [];
  const errorLogs = [];
  
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      time: new Date().toISOString()
    };
    consoleLogs.push(log);
    
    if (msg.type() === 'error') {
      errorLogs.push(log);
      console.log(`❌ 控制台错误: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ 控制台警告: ${msg.text()}`);
    }
  });
  
  // 捕获页面错误
  page.on('pageerror', error => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    };
    errorLogs.push(errorInfo);
    console.log(`💥 页面错误: ${error.message}`);
  });
  
  // 捕获网络请求失败
  page.on('requestfailed', request => {
    console.log(`🔴 请求失败: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    // 1. 访问主页
    console.log('📍 Step 1: 访问用户前端主页');
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    
    // 截图主页
    await page.screenshot({ path: 'screenshots/homepage.png' });
    console.log('   ✅ 主页加载成功\n');
    
    // 2. 点击注册链接
    console.log('📍 Step 2: 导航到注册页面');
    
    // 查找注册链接
    const registerLink = await page.getByText('注册').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForTimeout(1500);
    } else {
      // 直接导航到注册页
      await page.goto('https://ai-pm-user-frontend.vercel.app/register');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/register-page.png' });
    console.log('   ✅ 注册页面加载成功\n');
    
    // 3. 填写注册表单
    console.log('📍 Step 3: 填写注册表单');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = 'Test123456!';
    
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   👤 Username: ${testUsername}`);
    
    // 模拟真人输入
    const emailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"]').first();
    await emailInput.click();
    await emailInput.type(testEmail, { delay: 50 });
    
    await page.waitForTimeout(500);
    
    const usernameInput = await page.locator('input[placeholder*="用户名"], input[name="username"]').first();
    await usernameInput.click();
    await usernameInput.type(testUsername, { delay: 50 });
    
    await page.waitForTimeout(500);
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.click();
    await passwordInput.type(testPassword, { delay: 50 });
    
    await page.waitForTimeout(500);
    
    // 确认密码
    const confirmPasswordInput = await page.locator('input[type="password"]').nth(1);
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.click();
      await confirmPasswordInput.type(testPassword, { delay: 50 });
    }
    
    await page.screenshot({ path: 'screenshots/register-filled.png' });
    console.log('   ✅ 表单填写完成\n');
    
    // 4. 提交注册
    console.log('📍 Step 4: 提交注册表单');
    
    // 查找并点击注册按钮
    const registerButton = await page.locator('button').filter({ hasText: /注册|立即注册|确认注册/ }).first();
    
    // 监听网络响应
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/register'),
      { timeout: 10000 }
    ).catch(() => null);
    
    await registerButton.click();
    console.log('   ⏳ 等待服务器响应...');
    
    const response = await responsePromise;
    
    if (response) {
      const status = response.status();
      const body = await response.json().catch(() => ({}));
      
      console.log(`   📡 响应状态: ${status}`);
      console.log(`   📦 响应内容: ${JSON.stringify(body, null, 2)}`);
      
      if (status === 200 && body.success) {
        console.log('   ✅ 注册成功！\n');
      } else {
        console.log('   ❌ 注册失败\n');
      }
    } else {
      console.log('   ⚠️ 未收到服务器响应\n');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/register-result.png' });
    
    // 5. 测试登录
    console.log('📍 Step 5: 测试登录功能');
    
    // 导航到登录页
    await page.goto('https://ai-pm-user-frontend.vercel.app/login');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/login-page.png' });
    
    // 填写登录表单
    const loginEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"]').first();
    await loginEmailInput.click();
    await loginEmailInput.fill(''); // 清空
    await loginEmailInput.type(testEmail, { delay: 50 });
    
    const loginPasswordInput = await page.locator('input[type="password"]').first();
    await loginPasswordInput.click();
    await loginPasswordInput.type(testPassword, { delay: 50 });
    
    await page.screenshot({ path: 'screenshots/login-filled.png' });
    
    // 提交登录
    const loginButton = await page.locator('button').filter({ hasText: /登录|立即登录|确认登录/ }).first();
    
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);
    
    await loginButton.click();
    console.log('   ⏳ 等待登录响应...');
    
    const loginResponse = await loginResponsePromise;
    
    if (loginResponse) {
      const status = loginResponse.status();
      const body = await loginResponse.json().catch(() => ({}));
      
      console.log(`   📡 响应状态: ${status}`);
      console.log(`   📦 响应内容: ${JSON.stringify(body, null, 2)}`);
      
      if (status === 200 && body.success) {
        console.log('   ✅ 登录成功！\n');
      } else {
        console.log('   ❌ 登录失败\n');
      }
    } else {
      console.log('   ⚠️ 未收到登录响应\n');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/login-result.png' });
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  console.log('\n📝 控制台日志汇总:');
  console.log(`   总计: ${consoleLogs.length} 条`);
  console.log(`   错误: ${errorLogs.length} 条`);
  
  if (errorLogs.length > 0) {
    console.log('\n❌ 错误详情:');
    errorLogs.forEach((error, index) => {
      console.log(`\n   错误 #${index + 1}:`);
      console.log(`   时间: ${error.time}`);
      console.log(`   消息: ${error.message || error.text}`);
      if (error.location) {
        console.log(`   位置: ${error.location.url}:${error.location.lineNumber}`);
      }
    });
  }
  
  // 保存详细日志
  const fs = require('fs');
  fs.writeFileSync('test-results/console-logs.json', JSON.stringify(consoleLogs, null, 2));
  fs.writeFileSync('test-results/error-logs.json', JSON.stringify(errorLogs, null, 2));
  
  console.log('\n📁 详细日志已保存到:');
  console.log('   - test-results/console-logs.json');
  console.log('   - test-results/error-logs.json');
  console.log('   - screenshots/ (截图文件夹)');
  
  // 等待用户查看
  console.log('\n⏸️ 按 Ctrl+C 关闭浏览器...');
  await page.waitForTimeout(60000);
  
  await browser.close();
}

// 创建必要的目录
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// 运行测试
simulateRealUser().catch(console.error);