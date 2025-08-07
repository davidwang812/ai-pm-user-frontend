import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const API_URL = 'https://aiproductmanager-production.up.railway.app';

// 生成唯一测试数据（模拟真实用户）
const timestamp = Date.now().toString().slice(-6);
const realUserData = {
  email: `zhangwei${timestamp}@qq.com`, // 模拟真实中国用户
  username: `zhangwei${timestamp}`,
  password: 'Zw123456!@#', // 复杂密码
  originalUsername: `zhangwei${timestamp}` // 邮箱自动填充的用户名
};

// 详细的日志收集器
const detailedLogs = {
  console: [],
  errors: [],
  warnings: [],
  network: [],
  performance: [],
  pageErrors: [],
  failedRequests: []
};

async function simulateHumanBehavior() {
  console.log('🤖 开始模拟真人行为测试');
  console.log('=====================================');
  console.log(`📧 测试邮箱: ${realUserData.email}`);
  console.log(`👤 测试用户名: ${realUserData.username}`);
  console.log(`🔑 测试密码: ${realUserData.password}`);
  console.log(`🌐 测试站点: ${TEST_URL}`);
  console.log(`🔗 API地址: ${API_URL}`);
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: 500, // 模拟人类输入速度
    devtools: true, // 打开开发者工具
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security', // 临时禁用CORS检查
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    permissions: ['notifications', 'clipboard-read', 'clipboard-write'],
    recordVideo: {
      dir: 'videos/',
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // ============ 增强的事件监听器 ============
  
  // 监听所有控制台消息
  page.on('console', async msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
      location: msg.location(),
      args: []
    };
    
    // 尝试获取详细参数
    try {
      for (const arg of msg.args()) {
        log.args.push(await arg.jsonValue());
      }
    } catch (e) {
      // 忽略无法序列化的参数
    }
    
    detailedLogs.console.push(log);
    
    // 实时输出重要日志
    if (msg.type() === 'error') {
      console.log(`❌ [Console Error] ${msg.text()}`);
      detailedLogs.errors.push(log);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ [Console Warning] ${msg.text()}`);
      detailedLogs.warnings.push(log);
    } else if (msg.text().includes('API') || msg.text().includes('error') || msg.text().includes('fail')) {
      console.log(`ℹ️ [Console] ${msg.text()}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      time: new Date().toISOString()
    };
    detailedLogs.pageErrors.push(errorLog);
    console.log(`💥 [Page Error] ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[0]}`);
    }
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
      detailedLogs.network.push({ type: 'request', ...requestLog });
      
      console.log(`📤 [API ${request.method()}] ${url}`);
      if (request.postData()) {
        try {
          const data = JSON.parse(request.postData());
          console.log(`   请求数据:`, data);
        } catch (e) {
          console.log(`   请求数据: ${request.postData()}`);
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
        statusText: response.statusText(),
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
        responseLog.bodyError = e.message;
      }
      
      detailedLogs.network.push({ type: 'response', ...responseLog });
      
      console.log(`📥 [API响应 ${status}] ${url}`);
      if (responseLog.body) {
        console.log(`   响应数据:`, responseLog.body);
      }
      
      // 检查错误状态
      if (status >= 400) {
        console.log(`⚠️ [API错误] ${status} ${response.statusText()} - ${url}`);
        if (responseLog.body) {
          console.log(`   错误详情:`, responseLog.body);
        }
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
    detailedLogs.failedRequests.push(failure);
    console.log(`❌ [请求失败] ${request.method()} ${request.url()}`);
    if (request.failure()) {
      console.log(`   失败原因: ${request.failure().errorText}`);
    }
  });

  // 监听对话框
  page.on('dialog', async dialog => {
    console.log(`🔔 [对话框] ${dialog.type()}: ${dialog.message()}`);
    await dialog.accept();
  });

  // 监听页面加载性能
  page.on('load', async () => {
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: navigation?.loadEventEnd || 0,
        resources: performance.getEntriesByType('resource').length
      };
    });
    detailedLogs.performance.push(metrics);
    console.log(`⚡ [性能] DOMContentLoaded=${metrics.domContentLoaded}ms, Load=${metrics.loadComplete}ms, Resources=${metrics.resources}`);
  });

  try {
    // ========== 开始测试步骤 ==========
    
    // 步骤1: 访问首页
    console.log('\n📍 步骤1: 访问首页（模拟用户从搜索引擎进入）');
    await page.goto(TEST_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 模拟用户查看页面
    await page.waitForTimeout(2000);
    await page.mouse.move(500, 300);
    await page.mouse.wheel(0, 100);
    
    const initialUrl = page.url();
    console.log(`   当前URL: ${initialUrl}`);
    
    // 截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `1-home-human-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤2: 导航到注册页面（模拟用户点击注册）
    console.log('\n📍 步骤2: 寻找并点击注册链接');
    
    // 首先检查是否已经在登录页
    if (initialUrl.includes('login')) {
      console.log('   已在登录页，寻找注册链接...');
      
      // 模拟用户寻找注册链接
      await page.mouse.move(960, 540); // 移动到页面中心
      await page.waitForTimeout(1000);
      
      // 查找"立即注册"链接
      const registerLink = await page.locator('a:has-text("立即注册"), a:has-text("注册"), a[href*="register"]').first();
      if (await registerLink.isVisible()) {
        // 模拟用户hover
        await registerLink.hover();
        await page.waitForTimeout(500);
        await registerLink.click();
        console.log('   ✅ 点击了注册链接');
      }
    } else {
      // 直接访问注册页面
      console.log('   直接导航到注册页面...');
      await page.goto(`${TEST_URL}/register`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
    }
    
    await page.waitForTimeout(2000);
    console.log(`   当前URL: ${page.url()}`);
    
    // 检查页面是否正确加载
    const pageTitle = await page.title();
    console.log(`   页面标题: ${pageTitle}`);

    // 步骤3: 填写注册表单（模拟真人输入）
    console.log('\n📍 步骤3: 填写注册表单（模拟真人输入）');
    
    // 等待表单加载
    try {
      await page.waitForSelector('input[data-testid="register-email"], input[type="email"], input[placeholder*="邮箱"]', {
        timeout: 10000
      });
      console.log('   ✅ 注册表单已加载');
    } catch (e) {
      console.log('   ❌ 注册表单未找到，尝试其他选择器...');
      
      // 尝试查找任何输入框
      const inputs = await page.locator('input').all();
      console.log(`   页面上找到 ${inputs.length} 个输入框`);
      
      // 打印页面HTML结构
      const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
      console.log('   页面HTML片段:', bodyHTML);
    }
    
    // 模拟用户逐个填写表单
    console.log('   开始填写邮箱...');
    const emailInput = await page.locator('input[data-testid="register-email"], input[type="email"], input[placeholder*="邮箱"]').first();
    await emailInput.click();
    await page.waitForTimeout(500);
    
    // 模拟真人输入（逐字符输入）
    for (const char of realUserData.email) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 50); // 随机延迟50-100ms
    }
    console.log(`   ✅ 填写邮箱: ${realUserData.email}`);
    
    // 按Tab触发自动填充
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    // 检查用户名是否自动填充
    console.log('   检查用户名自动填充...');
    const usernameInput = await page.locator('input[data-testid="register-username"], input[placeholder*="用户名"]').first();
    const autoFilledUsername = await usernameInput.inputValue();
    console.log(`   📝 自动填充的用户名: ${autoFilledUsername}`);
    
    // 清空并重新输入用户名（模拟用户修改）
    await usernameInput.click();
    await page.waitForTimeout(500);
    await usernameInput.press('Control+A'); // 全选
    await page.waitForTimeout(200);
    
    // 输入新用户名
    for (const char of realUserData.username) {
      await page.keyboard.type(char);
      await page.waitForTimeout(30 + Math.random() * 30);
    }
    console.log(`   ✅ 修改用户名为: ${realUserData.username}`);
    
    // 填写密码
    console.log('   填写密码...');
    const passwordInput = await page.locator('input[data-testid="register-password"], input[type="password"]').first();
    await passwordInput.click();
    await page.waitForTimeout(500);
    
    for (const char of realUserData.password) {
      await page.keyboard.type(char);
      await page.waitForTimeout(40 + Math.random() * 40);
    }
    console.log('   ✅ 填写密码');
    
    // 填写确认密码
    console.log('   填写确认密码...');
    const confirmPasswordInput = await page.locator('input[data-testid="register-confirm-password"]').first();
    await confirmPasswordInput.click();
    await page.waitForTimeout(500);
    
    for (const char of realUserData.password) {
      await page.keyboard.type(char);
      await page.waitForTimeout(30 + Math.random() * 30);
    }
    console.log('   ✅ 填写确认密码');
    
    // 勾选用户协议（模拟用户阅读后勾选）
    console.log('   阅读并勾选用户协议...');
    await page.mouse.move(500, 600);
    await page.waitForTimeout(2000); // 模拟阅读时间
    
    const checkbox = await page.locator('.el-checkbox, input[type="checkbox"]').first();
    await checkbox.click();
    console.log('   ✅ 勾选用户协议');
    
    // 截图填写完成的表单
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `2-register-form-human-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤4: 提交注册（模拟用户思考后点击）
    console.log('\n📍 步骤4: 提交注册');
    
    // 模拟用户检查表单
    await page.mouse.move(600, 400);
    await page.waitForTimeout(1500);
    
    // 查找并点击注册按钮
    const registerButton = await page.locator('button[data-testid="register-submit"], button:has-text("注册"), button:has-text("立即注册")').first();
    await registerButton.hover();
    await page.waitForTimeout(500);
    
    // 设置响应等待
    const [registerResponse] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/auth/register'),
        { timeout: 15000 }
      ).catch(() => null),
      registerButton.click()
    ]);
    
    console.log('   点击注册按钮');
    
    if (registerResponse) {
      const status = registerResponse.status();
      console.log(`   📡 注册响应状态: ${status}`);
      
      try {
        const responseBody = await registerResponse.json();
        console.log('   响应内容:', responseBody);
        
        if (status === 200 || status === 201) {
          console.log('   ✅ 注册成功！');
        } else if (status === 400) {
          console.log('   ⚠️ 请求参数错误:', responseBody.message);
        } else if (status === 409) {
          console.log('   ⚠️ 用户已存在');
        } else if (status === 500) {
          console.log('   ❌ 服务器内部错误');
        } else {
          console.log('   ❌ 注册失败');
        }
      } catch (e) {
        console.log('   无法解析响应体');
      }
    } else {
      console.log('   ⚠️ 未收到注册响应');
    }
    
    // 等待可能的页面跳转
    await page.waitForTimeout(3000);
    const afterRegisterUrl = page.url();
    console.log(`   注册后URL: ${afterRegisterUrl}`);
    
    // 截图注册结果
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `3-register-result-human-${timestamp}.png`),
      fullPage: true 
    });

    // 步骤5: 如果注册失败，尝试登录
    if (!afterRegisterUrl.includes('dashboard')) {
      console.log('\n📍 步骤5: 尝试登录');
      
      // 导航到登录页
      if (!page.url().includes('login')) {
        await page.goto(`${TEST_URL}/login`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
      }
      
      // 填写登录表单
      console.log('   填写登录表单...');
      const loginEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').first();
      await loginEmailInput.click();
      await loginEmailInput.fill(realUserData.email);
      console.log(`   ✅ 填写邮箱: ${realUserData.email}`);
      
      const loginPasswordInput = await page.locator('input[type="password"]').first();
      await loginPasswordInput.click();
      await loginPasswordInput.fill(realUserData.password);
      console.log('   ✅ 填写密码');
      
      // 提交登录
      const loginButton = await page.locator('button:has-text("登录"), button:has-text("登入")').first();
      
      const [loginResponse] = await Promise.all([
        page.waitForResponse(
          resp => resp.url().includes('/api/auth/login'),
          { timeout: 15000 }
        ).catch(() => null),
        loginButton.click()
      ]);
      
      console.log('   点击登录按钮');
      
      if (loginResponse) {
        const status = loginResponse.status();
        console.log(`   📡 登录响应状态: ${status}`);
        
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
    }
    
    // 最终截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `4-final-human-${timestamp}.png`),
      fullPage: true 
    });

    // ========== 深度分析 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 深度分析报告');
    console.log('='.repeat(60));
    
    // 1. 控制台日志分析
    console.log('\n📋 控制台日志分析:');
    console.log(`   总计日志: ${detailedLogs.console.length} 条`);
    console.log(`   错误: ${detailedLogs.errors.length} 条`);
    console.log(`   警告: ${detailedLogs.warnings.length} 条`);
    console.log(`   页面错误: ${detailedLogs.pageErrors.length} 条`);
    
    if (detailedLogs.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      detailedLogs.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`);
        if (error.location) {
          console.log(`      位置: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    }
    
    if (detailedLogs.pageErrors.length > 0) {
      console.log('\n💥 页面错误详情:');
      detailedLogs.pageErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }
    
    // 2. 网络请求分析
    const apiRequests = detailedLogs.network.filter(l => l.type === 'request');
    const apiResponses = detailedLogs.network.filter(l => l.type === 'response');
    const failedRequests = detailedLogs.failedRequests;
    
    console.log('\n🌐 网络请求分析:');
    console.log(`   API请求: ${apiRequests.length} 个`);
    console.log(`   API响应: ${apiResponses.length} 个`);
    console.log(`   失败请求: ${failedRequests.length} 个`);
    
    // 分析错误响应
    const errorResponses = apiResponses.filter(r => r.status >= 400);
    if (errorResponses.length > 0) {
      console.log('\n⚠️ 错误响应详情:');
      errorResponses.forEach((resp, index) => {
        console.log(`   ${index + 1}. [${resp.status}] ${resp.url}`);
        if (resp.body) {
          console.log(`      错误信息: ${resp.body.message || JSON.stringify(resp.body)}`);
        }
      });
    }
    
    // 3. 性能分析
    if (detailedLogs.performance.length > 0) {
      console.log('\n⚡ 性能指标:');
      detailedLogs.performance.forEach((perf, index) => {
        console.log(`   页面${index + 1}:`);
        console.log(`     DOMContentLoaded: ${perf.domContentLoaded}ms`);
        console.log(`     Load: ${perf.loadComplete}ms`);
        console.log(`     资源数: ${perf.resources}`);
      });
    }
    
    // 4. 诊断建议
    console.log('\n🔍 诊断建议:');
    
    if (detailedLogs.errors.length > 0) {
      console.log('   ⚠️ 发现JavaScript错误，需要修复前端代码');
    }
    
    if (errorResponses.some(r => r.status === 400)) {
      console.log('   ⚠️ 存在400错误，检查请求参数格式');
    }
    
    if (errorResponses.some(r => r.status === 500)) {
      console.log('   ⚠️ 存在500错误，检查后端服务');
    }
    
    if (failedRequests.length > 0) {
      console.log('   ⚠️ 存在失败的网络请求，检查网络连接或CORS配置');
    }
    
    // 保持浏览器打开以便查看
    console.log('\n⏸️ 浏览器保持打开15秒以便查看...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    
    // 错误截图
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', `error-human-${timestamp}.png`),
      fullPage: true 
    });
  } finally {
    // 保存完整日志
    const fs = await import('fs');
    const logFileName = `human-test-logs-${timestamp}.json`;
    fs.writeFileSync(
      join(__dirname, logFileName),
      JSON.stringify(detailedLogs, null, 2)
    );
    console.log(`\n📁 详细日志已保存: ${logFileName}`);
    
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
simulateHumanBehavior().catch(console.error);