// 增强的网络监控测试
import { chromium } from 'playwright';
import fs from 'fs';

async function testWithNetworkMonitoring() {
  console.log('🎭 启动网络监控测试...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security'] // 禁用CORS检查
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    // 允许所有权限
    permissions: ['geolocation', 'notifications'],
    // 忽略HTTPS错误
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // 增强的日志收集
  const allLogs = {
    console: [],
    errors: [],
    network: {
      requests: [],
      responses: [],
      failures: []
    }
  };
  
  // 拦截控制台
  await page.evaluateOnNewDocument(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    window.__consoleLogs = [];
    
    console.log = (...args) => {
      window.__consoleLogs.push({ type: 'log', args, time: new Date().toISOString() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      window.__consoleLogs.push({ type: 'error', args, time: new Date().toISOString() });
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      window.__consoleLogs.push({ type: 'warn', args, time: new Date().toISOString() });
      originalWarn.apply(console, args);
    };
  });
  
  // 监听所有网络请求
  page.on('request', request => {
    const reqInfo = {
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
      time: new Date().toISOString()
    };
    
    allLogs.network.requests.push(reqInfo);
    
    if (request.url().includes('/api/')) {
      console.log(`\n📤 API请求: ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`   请求数据: ${request.postData()}`);
      }
    }
  });
  
  // 监听所有网络响应
  page.on('response', async response => {
    const respInfo = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      time: new Date().toISOString()
    };
    
    // 尝试获取响应体
    try {
      if (response.url().includes('/api/')) {
        const body = await response.text();
        respInfo.body = body;
        console.log(`📥 API响应: ${response.status()} ${response.url()}`);
        console.log(`   响应数据: ${body}`);
      }
    } catch (e) {
      // 忽略无法读取的响应
    }
    
    allLogs.network.responses.push(respInfo);
    
    if (response.status() >= 400) {
      console.log(`❌ HTTP错误: ${response.status()} ${response.url()}`);
    }
  });
  
  // 监听请求失败
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      method: request.method(),
      error: request.failure().errorText,
      time: new Date().toISOString()
    };
    
    allLogs.network.failures.push(failure);
    console.log(`🔴 请求失败: ${request.url()}`);
    console.log(`   错误: ${request.failure().errorText}`);
  });
  
  // 监听控制台
  page.on('console', msg => {
    allLogs.console.push({
      type: msg.type(),
      text: msg.text(),
      args: msg.args(),
      location: msg.location()
    });
    
    if (msg.type() === 'error') {
      console.log(`❌ 浏览器错误: ${msg.text()}`);
    }
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    allLogs.errors.push({
      message: error.message,
      stack: error.stack
    });
    console.log(`💥 页面崩溃: ${error.message}`);
  });
  
  try {
    // 1. 访问注册页面
    console.log('\n📍 直接访问注册页面...');
    await page.goto('https://ai-pm-user-frontend.vercel.app/register', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // 等待Vue加载
    await page.waitForTimeout(3000);
    
    // 获取页面控制台日志
    const consoleLogs = await page.evaluate(() => window.__consoleLogs || []);
    console.log(`\n📝 页面控制台日志: ${consoleLogs.length} 条`);
    
    // 检查Vue是否加载
    const vueLoaded = await page.evaluate(() => {
      return typeof window.Vue !== 'undefined' || document.querySelector('#app').__vue_app__;
    }).catch(() => false);
    
    console.log(`Vue状态: ${vueLoaded ? '✅ 已加载' : '❌ 未加载'}`);
    
    // 截图
    await page.screenshot({ path: 'screenshots/register-loaded.png', fullPage: true });
    
    // 2. 尝试通过JavaScript填写表单
    console.log('\n📍 通过JavaScript填写表单...');
    
    const timestamp = Date.now();
    const testData = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'Test123456!'
    };
    
    console.log(`测试数据:`);
    console.log(`  Email: ${testData.email}`);
    console.log(`  Username: ${testData.username}`);
    
    // 尝试填写表单
    const formFilled = await page.evaluate((data) => {
      const emailInput = document.querySelector('input[type="email"], input[placeholder*="邮箱"]');
      const usernameInput = document.querySelector('input[placeholder*="用户名"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const confirmPasswordInput = document.querySelectorAll('input[type="password"]')[1];
      
      if (emailInput && usernameInput && passwordInput) {
        emailInput.value = data.email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        usernameInput.value = data.username;
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        passwordInput.value = data.password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        if (confirmPasswordInput) {
          confirmPasswordInput.value = data.password;
          confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        return true;
      }
      return false;
    }, testData);
    
    if (formFilled) {
      console.log('✅ 表单填写成功');
      await page.screenshot({ path: 'screenshots/form-filled.png' });
      
      // 3. 尝试提交表单
      console.log('\n📍 提交注册表单...');
      
      // 先检查是否有提交按钮
      const hasSubmitButton = await page.evaluate(() => {
        const button = document.querySelector('button[type="submit"], button.el-button--primary');
        return !!button;
      });
      
      if (hasSubmitButton) {
        // 点击提交按钮
        await page.click('button[type="submit"], button.el-button--primary');
        console.log('✅ 已点击提交按钮');
        
        // 等待可能的网络请求
        await page.waitForTimeout(5000);
        
        // 截图结果
        await page.screenshot({ path: 'screenshots/after-submit.png' });
        
        // 检查是否有错误提示
        const errorMessage = await page.evaluate(() => {
          const messageEl = document.querySelector('.el-message--error');
          return messageEl ? messageEl.textContent : null;
        });
        
        if (errorMessage) {
          console.log(`❌ 错误提示: ${errorMessage}`);
        }
      } else {
        console.log('❌ 未找到提交按钮');
      }
    } else {
      console.log('❌ 表单填写失败');
    }
    
    // 4. 检查网络请求
    console.log('\n📊 网络请求分析:');
    const apiRequests = allLogs.network.requests.filter(r => r.url.includes('/api/'));
    console.log(`  API请求总数: ${apiRequests.length}`);
    
    if (apiRequests.length > 0) {
      apiRequests.forEach((req, i) => {
        console.log(`\n  请求 #${i + 1}:`);
        console.log(`    URL: ${req.url}`);
        console.log(`    方法: ${req.method}`);
        if (req.postData) {
          console.log(`    数据: ${req.postData}`);
        }
      });
    }
    
    // 5. 测试直接API调用
    console.log('\n📍 测试直接API调用...');
    const apiResponse = await page.evaluate(async (data) => {
      try {
        const response = await fetch('https://aiproductmanager-production.up.railway.app/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return {
          status: response.status,
          data: result
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, testData);
    
    console.log('API调用结果:', JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('测试错误:', error);
  }
  
  // 保存所有日志
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  fs.writeFileSync('test-results/all-logs.json', JSON.stringify(allLogs, null, 2));
  
  console.log('\n📁 完整日志已保存到: test-results/all-logs.json');
  console.log('📸 截图已保存到: screenshots/');
  
  await browser.close();
  console.log('\n✅ 测试完成');
}

// 创建截图目录
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// 运行测试
testWithNetworkMonitoring().catch(console.error);