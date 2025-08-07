import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const timestamp = String(Date.now()).slice(-6);
const testEmail = `test${timestamp}@example.com`;
const testUsername = `user${timestamp}`;
const testPassword = 'Test123456!';

console.log('🚀 完整注册和登录测试');
console.log(`📧 邮箱: ${testEmail}`);
console.log(`👤 用户名: ${testUsername}`);
console.log(`🔑 密码: ${testPassword}`);
console.log('================================\n');

async function completeTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // API调用记录
  const apiCalls = [];

  // 监听所有请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const call = {
        method: request.method(),
        url: url,
        timestamp: new Date().toISOString()
      };
      
      if (request.postData()) {
        call.data = request.postData();
      }
      
      apiCalls.push(call);
      console.log(`\n📤 [${new Date().toLocaleTimeString()}] ${request.method()} ${url}`);
      if (call.data) {
        try {
          const parsed = JSON.parse(call.data);
          console.log(`   请求数据:`, parsed);
        } catch (e) {
          console.log(`   请求数据: ${call.data}`);
        }
      }
    }
  });

  // 监听所有响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      console.log(`📥 [${new Date().toLocaleTimeString()}] ${status} ${url}`);
      
      try {
        const body = await response.text();
        if (body) {
          const parsed = JSON.parse(body);
          console.log(`   响应数据:`, parsed);
          
          // 记录到对应的请求
          const matchingCall = apiCalls.find(call => call.url === url && !call.response);
          if (matchingCall) {
            matchingCall.response = {
              status: status,
              body: parsed
            };
          }
        }
      } catch (e) {
        console.log(`   响应解析失败: ${e.message}`);
      }
    }
  });

  // 监听控制台
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n❌ 控制台错误: ${msg.text()}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`\n💥 页面错误: ${error.message}`);
  });

  try {
    // ========== 第一部分：注册 ==========
    console.log('\n════════════════════════════════════════');
    console.log('📝 第一部分：用户注册');
    console.log('════════════════════════════════════════\n');

    // 1. 访问首页
    console.log('1️⃣ 访问首页...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log(`   当前URL: ${page.url()}`);

    // 2. 导航到注册页
    console.log('\n2️⃣ 导航到注册页面...');
    
    // 如果在登录页，点击注册链接
    if (page.url().includes('login')) {
      const registerLink = await page.locator('a:has-text("立即注册"), span:has-text("立即注册")').first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForTimeout(1000);
      }
    } else {
      await page.goto(`${TEST_URL}/register`);
    }
    
    console.log(`   当前URL: ${page.url()}`);

    // 3. 填写注册表单
    console.log('\n3️⃣ 填写注册表单...');
    
    // 邮箱
    await page.fill('input[type="email"], input[placeholder*="邮箱"]', testEmail);
    console.log(`   ✅ 邮箱: ${testEmail}`);
    
    // 触发自动填充
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // 用户名
    const usernameInput = await page.locator('input[placeholder*="用户名"]').first();
    const autoFilledUsername = await usernameInput.inputValue();
    if (autoFilledUsername) {
      console.log(`   📝 自动填充用户名: ${autoFilledUsername}`);
    }
    await usernameInput.clear();
    await usernameInput.fill(testUsername);
    console.log(`   ✅ 用户名: ${testUsername}`);
    
    // 密码
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill(testPassword);
      console.log(`   ✅ 密码: ${testPassword}`);
      await passwordInputs[1].fill(testPassword);
      console.log(`   ✅ 确认密码: ${testPassword}`);
    }
    
    // 用户协议
    const checkbox = await page.locator('.el-checkbox').first();
    await checkbox.click();
    console.log(`   ✅ 已勾选用户协议`);

    // 4. 提交注册
    console.log('\n4️⃣ 提交注册...');
    
    // 点击注册按钮并等待响应
    const [registerResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/register'), { timeout: 10000 }).catch(() => null),
      page.click('button:has-text("注册"), button:has-text("立即注册")')
    ]);
    
    if (registerResponse) {
      const status = registerResponse.status();
      console.log(`   📡 注册响应状态: ${status}`);
      
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
    console.log(`   注册后URL: ${page.url()}`);

    // ========== 第二部分：登录 ==========
    console.log('\n════════════════════════════════════════');
    console.log('🔐 第二部分：用户登录');
    console.log('════════════════════════════════════════\n');

    // 5. 导航到登录页
    console.log('5️⃣ 导航到登录页面...');
    
    // 如果注册成功可能已经自动登录
    if (page.url().includes('dashboard')) {
      console.log('   ✅ 已自动登录到仪表板');
      
      // 登出以测试登录
      const logoutBtn = await page.locator('button:has-text("退出"), button:has-text("登出")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 导航到登录页
    if (!page.url().includes('login')) {
      await page.goto(`${TEST_URL}/login`);
      await page.waitForTimeout(1000);
    }
    console.log(`   当前URL: ${page.url()}`);

    // 6. 填写登录表单
    console.log('\n6️⃣ 填写登录表单...');
    
    await page.fill('input[type="email"], input[placeholder*="邮箱"]', testEmail);
    console.log(`   ✅ 邮箱: ${testEmail}`);
    
    await page.fill('input[type="password"]', testPassword);
    console.log(`   ✅ 密码: ${testPassword}`);

    // 7. 提交登录
    console.log('\n7️⃣ 提交登录...');
    
    const [loginResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }).catch(() => null),
      page.click('button:has-text("登录"), button:has-text("登入")')
    ]);
    
    if (loginResponse) {
      const status = loginResponse.status();
      console.log(`   📡 登录响应状态: ${status}`);
      
      if (status === 200) {
        console.log('   ✅ 登录成功！');
        
        // 检查是否有token
        const body = await loginResponse.json();
        if (body.token) {
          console.log('   🔑 获得JWT Token');
        }
      } else if (status === 401) {
        console.log('   ❌ 登录失败：用户名或密码错误');
      } else {
        console.log('   ❌ 登录失败');
      }
    }
    
    // 等待页面跳转
    await page.waitForTimeout(3000);
    console.log(`   登录后URL: ${page.url()}`);
    
    // 检查是否成功进入仪表板
    if (page.url().includes('dashboard')) {
      console.log('   ✅ 成功进入用户仪表板！');
    }

    // ========== 测试总结 ==========
    console.log('\n════════════════════════════════════════');
    console.log('📊 测试总结');
    console.log('════════════════════════════════════════\n');
    
    console.log('API调用记录:');
    apiCalls.forEach((call, index) => {
      console.log(`\n${index + 1}. ${call.method} ${call.url}`);
      if (call.response) {
        console.log(`   状态: ${call.response.status}`);
        if (call.response.body) {
          console.log(`   响应:`, call.response.body);
        }
      } else {
        console.log(`   状态: 无响应`);
      }
    });
    
    // 截图最终状态
    await page.screenshot({ 
      path: `test-complete-${timestamp}.png`,
      fullPage: true 
    });
    console.log('\n📸 已保存截图: test-complete-' + timestamp + '.png');
    
    // 保持浏览器打开
    console.log('\n⏸️ 浏览器保持打开15秒供检查...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 测试结束');
  }
}

completeTest().catch(console.error);