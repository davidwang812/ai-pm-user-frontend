import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const timestamp = Date.now().toString().slice(-6);

async function quickFullTest() {
  console.log('🔍 快速完整测试');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: true,  // 无头模式更快
    devtools: false
  });

  const page = await browser.newPage();
  
  // 收集所有日志
  const logs = { 
    console: [], 
    errors: [], 
    network: [],
    messages: []
  };
  
  // 监听控制台
  page.on('console', msg => {
    const log = { type: msg.type(), text: msg.text() };
    logs.console.push(log);
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      logs.errors.push(log);
    }
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
    logs.errors.push({ message: error.message });
  });
  
  // 监听API响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      const method = response.request().method();
      
      try {
        const body = await response.text();
        const data = body ? JSON.parse(body) : null;
        
        logs.network.push({ 
          method, 
          url: url.split('/api/')[1], 
          status, 
          body: data 
        });
        
        console.log(`📡 [${method}] ${url.split('/api/')[1]} -> ${status}`);
        if (data && data.message) {
          console.log(`   消息: ${data.message}`);
        }
      } catch (e) {}
    }
  });

  try {
    // ========== 场景1: 测试重复注册 ==========
    console.log('🧪 场景1: 测试重复注册的用户体验');
    console.log('─'.repeat(40));
    
    await page.goto(`${TEST_URL}/register`, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // 填写已存在的用户
    const existingUser = {
      email: 'testuser999@example.com',
      username: 'testuser999',
      password: 'testpass123'
    };
    
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[placeholder*="用户名"]', existingUser.username);
    
    const passwordInputs = await page.locator('input[type="password"]').all();
    for (const input of passwordInputs) {
      await input.fill(existingUser.password);
    }
    
    await page.click('.el-checkbox');
    
    console.log(`📝 测试用户: ${existingUser.email}`);
    
    // 提交并等待提示
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(2000);
    
    // 检查Element Plus消息
    const messages = await page.evaluate(() => {
      const msgs = [];
      document.querySelectorAll('.el-message').forEach(el => {
        msgs.push({
          type: el.className.includes('warning') ? 'warning' : 
                el.className.includes('error') ? 'error' : 
                el.className.includes('success') ? 'success' : 'info',
          text: el.textContent.trim()
        });
      });
      return msgs;
    });
    
    if (messages.length > 0) {
      console.log('\n✅ 用户提示检测:');
      messages.forEach(msg => {
        const icon = msg.type === 'warning' ? '⚠️' : 
                     msg.type === 'error' ? '❌' : '✅';
        console.log(`   ${icon} [${msg.type}] ${msg.text}`);
        logs.messages.push(msg);
      });
      
      // 判断测试结果
      const hasWarning = messages.some(m => m.type === 'warning');
      console.log(`\n   测试结果: ${hasWarning ? '✅ PASS - 显示友好警告' : '❌ FAIL - 应该显示警告而不是错误'}`);
    } else {
      console.log('   ⚠️ 未检测到提示消息');
    }
    
    // ========== 场景2: 成功注册新用户 ==========
    console.log('\n🧪 场景2: 注册新用户');
    console.log('─'.repeat(40));
    
    const newUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'Test123456!'
    };
    
    // 清空并填写新数据
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[placeholder*="用户名"]', '');
    await page.fill('input[placeholder*="用户名"]', newUser.username);
    
    console.log(`📝 新用户: ${newUser.email}`);
    
    // 提交注册
    const [registerResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/register')),
      page.click('button:has-text("注册")')
    ]);
    
    const registerStatus = registerResponse.status();
    console.log(`   响应状态: ${registerStatus}`);
    
    if (registerStatus === 201 || registerStatus === 200) {
      console.log('   ✅ 注册成功');
      
      // 等待跳转
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('dashboard')) {
        console.log('   ✅ 已自动登录到仪表板');
      } else if (currentUrl.includes('login')) {
        console.log('   ℹ️ 跳转到登录页');
      }
    } else {
      console.log('   ❌ 注册失败');
    }
    
    // ========== 场景3: 登录测试 ==========
    console.log('\n🧪 场景3: 用户登录');
    console.log('─'.repeat(40));
    
    // 导航到登录页
    if (!page.url().includes('login')) {
      await page.goto(`${TEST_URL}/login`, {
        waitUntil: 'domcontentloaded'
      });
    }
    
    // 填写登录表单
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[type="password"]', newUser.password);
    
    console.log(`📝 登录用户: ${newUser.email}`);
    
    // 提交登录
    const [loginResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
      page.click('button:has-text("登录"), button:has-text("登入")')
    ]);
    
    const loginStatus = loginResponse.status();
    console.log(`   响应状态: ${loginStatus}`);
    
    if (loginStatus === 200) {
      console.log('   ✅ 登录成功');
      
      await page.waitForTimeout(2000);
      if (page.url().includes('dashboard')) {
        console.log('   ✅ 进入仪表板');
      }
    } else {
      console.log('   ❌ 登录失败');
    }
    
    // ========== 分析总结 ==========
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试分析总结');
    console.log('='.repeat(50));
    
    // 1. 错误分析
    console.log('\n📋 错误统计:');
    console.log(`   控制台错误: ${logs.errors.length} 个`);
    
    if (logs.errors.length > 0) {
      console.log('\n   错误详情:');
      logs.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.text || err.message}`);
      });
    } else {
      console.log('   ✅ 无错误');
    }
    
    // 2. 网络请求分析
    console.log('\n📡 API请求分析:');
    const apiCalls = {};
    logs.network.forEach(req => {
      const key = `${req.method} ${req.url}`;
      apiCalls[key] = (apiCalls[key] || 0) + 1;
    });
    
    Object.entries(apiCalls).forEach(([api, count]) => {
      console.log(`   ${api}: ${count} 次`);
    });
    
    // 3. 状态码分布
    const statusCodes = {};
    logs.network.forEach(req => {
      statusCodes[req.status] = (statusCodes[req.status] || 0) + 1;
    });
    
    console.log('\n📊 响应状态分布:');
    Object.entries(statusCodes).forEach(([status, count]) => {
      const icon = status < 300 ? '✅' : status < 400 ? '🔄' : '❌';
      console.log(`   ${icon} ${status}: ${count} 次`);
    });
    
    // 4. 用户体验评估
    console.log('\n🎯 用户体验评估:');
    
    const hasWarningMessages = logs.messages.some(m => m.type === 'warning');
    const hasErrorMessages = logs.messages.some(m => m.type === 'error');
    const has409Handled = logs.network.some(r => r.status === 409);
    
    console.log(`   重复注册提示: ${hasWarningMessages ? '✅ 友好警告' : hasErrorMessages ? '⚠️ 显示错误' : '❌ 无提示'}`);
    console.log(`   409状态处理: ${has409Handled ? '✅ 已处理' : '❌ 未检测到'}`);
    console.log(`   控制台错误: ${logs.errors.length === 0 ? '✅ 无错误' : `⚠️ ${logs.errors.length} 个错误`}`);
    
    // 5. 总体评分
    let score = 0;
    if (hasWarningMessages) score += 30;
    if (has409Handled) score += 30;
    if (logs.errors.length === 0) score += 20;
    if (logs.network.some(r => r.status === 201)) score += 10;
    if (logs.network.some(r => r.status === 200 && r.url.includes('login'))) score += 10;
    
    console.log(`\n📈 总体评分: ${score}/100`);
    
    if (score >= 80) {
      console.log('   🎉 优秀！用户体验良好');
    } else if (score >= 60) {
      console.log('   ✅ 良好，有改进空间');
    } else {
      console.log('   ⚠️ 需要改进用户体验');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

quickFullTest().catch(console.error);