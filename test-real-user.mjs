// 真人模拟测试 - 登录和注册功能
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function simulateRealUser() {
  console.log('🎭 启动真人模拟测试...\n');
  
  const browser = await chromium.launch({
    headless: true, // 无头模式运行
    slowMo: 100, // 模拟真人操作速度
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 收集控制台日志
  const consoleLogs = [];
  const errorLogs = [];
  const networkErrors = [];
  
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
  
  // 捕获网络请求
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 API请求: ${request.method()} ${request.url()}`);
    }
  });
  
  // 捕获网络响应
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 API响应: ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          time: new Date().toISOString()
        });
      }
    }
  });
  
  // 捕获网络请求失败
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      error: request.failure().errorText,
      time: new Date().toISOString()
    };
    networkErrors.push(failure);
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
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
    console.log('   ✅ 主页加载成功\n');
    
    // 检查页面是否正常渲染
    const appElement = await page.$('#app');
    if (appElement) {
      console.log('   ✅ Vue应用已挂载');
    } else {
      console.log('   ❌ Vue应用未正确挂载');
    }
    
    // 2. 导航到注册页面
    console.log('📍 Step 2: 导航到注册页面');
    
    // 尝试直接导航
    await page.goto('https://ai-pm-user-frontend.vercel.app/register', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/register-page.png', fullPage: true });
    console.log('   ✅ 注册页面加载成功\n');
    
    // 3. 检查注册表单元素
    console.log('📍 Step 3: 检查注册表单');
    
    const formElements = {
      email: await page.$('input[type="email"], input[placeholder*="邮箱"], #email'),
      username: await page.$('input[placeholder*="用户名"], #username'),
      password: await page.$('input[type="password"]'),
      submitButton: await page.$('button[type="submit"], button:has-text("注册")')
    };
    
    console.log('   表单元素检查:');
    console.log(`   - Email输入框: ${formElements.email ? '✅' : '❌'}`);
    console.log(`   - 用户名输入框: ${formElements.username ? '✅' : '❌'}`);
    console.log(`   - 密码输入框: ${formElements.password ? '✅' : '❌'}`);
    console.log(`   - 注册按钮: ${formElements.submitButton ? '✅' : '❌'}`);
    
    // 如果找到表单，尝试填写
    if (formElements.email && formElements.username && formElements.password) {
      console.log('\n📍 Step 4: 填写注册表单');
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;
      const testUsername = `testuser${timestamp}`;
      const testPassword = 'Test123456!';
      
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   👤 Username: ${testUsername}`);
      
      await formElements.email.type(testEmail, { delay: 50 });
      await formElements.username.type(testUsername, { delay: 50 });
      await formElements.password.type(testPassword, { delay: 50 });
      
      // 处理确认密码字段
      const confirmPassword = await page.$('input[type="password"]:nth-of-type(2), #confirmPassword');
      if (confirmPassword) {
        await confirmPassword.type(testPassword, { delay: 50 });
      }
      
      await page.screenshot({ path: 'screenshots/register-filled.png' });
      console.log('   ✅ 表单填写完成\n');
      
      if (formElements.submitButton) {
        console.log('📍 Step 5: 提交注册');
        
        // 监听API响应
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/api/auth/register'),
          { timeout: 10000 }
        ).catch(() => null);
        
        await formElements.submitButton.click();
        console.log('   ⏳ 等待服务器响应...');
        
        const response = await responsePromise;
        
        if (response) {
          const status = response.status();
          let body = {};
          try {
            body = await response.json();
          } catch (e) {
            console.log('   ⚠️ 无法解析响应JSON');
          }
          
          console.log(`   📡 响应状态: ${status}`);
          console.log(`   📦 响应内容: ${JSON.stringify(body, null, 2)}`);
        } else {
          console.log('   ⚠️ 未收到服务器响应');
        }
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/register-result.png' });
      }
    } else {
      console.log('   ❌ 未找到完整的注册表单');
    }
    
    // 4. 测试登录页面
    console.log('\n📍 Step 6: 测试登录页面');
    await page.goto('https://ai-pm-user-frontend.vercel.app/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
    
    // 检查登录表单
    const loginForm = {
      email: await page.$('input[type="email"], input[placeholder*="邮箱"], #email'),
      password: await page.$('input[type="password"]'),
      submitButton: await page.$('button[type="submit"], button:has-text("登录")')
    };
    
    console.log('   登录表单检查:');
    console.log(`   - Email输入框: ${loginForm.email ? '✅' : '❌'}`);
    console.log(`   - 密码输入框: ${loginForm.password ? '✅' : '❌'}`);
    console.log(`   - 登录按钮: ${loginForm.submitButton ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  console.log('\n📝 日志统计:');
  console.log(`   控制台日志: ${consoleLogs.length} 条`);
  console.log(`   错误日志: ${errorLogs.length} 条`);
  console.log(`   网络错误: ${networkErrors.length} 个`);
  
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
  
  if (networkErrors.length > 0) {
    console.log('\n🔴 网络错误:');
    networkErrors.forEach((error, index) => {
      console.log(`\n   错误 #${index + 1}:`);
      console.log(`   URL: ${error.url}`);
      console.log(`   状态: ${error.status || error.error}`);
      console.log(`   时间: ${error.time}`);
    });
  }
  
  // 保存详细日志
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  fs.writeFileSync('test-results/console-logs.json', JSON.stringify(consoleLogs, null, 2));
  fs.writeFileSync('test-results/error-logs.json', JSON.stringify(errorLogs, null, 2));
  fs.writeFileSync('test-results/network-errors.json', JSON.stringify(networkErrors, null, 2));
  
  console.log('\n📁 详细日志已保存到:');
  console.log('   - test-results/console-logs.json');
  console.log('   - test-results/error-logs.json');
  console.log('   - test-results/network-errors.json');
  console.log('   - screenshots/ (截图文件夹)');
  
  await browser.close();
  console.log('\n✅ 测试完成');
}

// 创建必要的目录
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// 运行测试
simulateRealUser().catch(console.error);