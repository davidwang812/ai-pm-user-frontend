import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const API_URL = 'https://aiproductmanager-production.up.railway.app';

async function testRegisterIssue() {
  console.log('🔍 诊断注册400错误问题');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const page = await browser.newPage();
  
  // 详细的请求日志
  page.on('request', request => {
    if (request.url().includes('/api/auth/register')) {
      console.log('📤 注册请求:');
      console.log('   URL:', request.url());
      console.log('   Method:', request.method());
      console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log('   请求数据:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('   请求数据(raw):', postData);
        }
      }
    }
  });
  
  // 详细的响应日志
  page.on('response', async response => {
    if (response.url().includes('/api/auth/register')) {
      console.log('\n📥 注册响应:');
      console.log('   状态码:', response.status());
      console.log('   Headers:', JSON.stringify(response.headers(), null, 2));
      try {
        const body = await response.text();
        const data = JSON.parse(body);
        console.log('   响应数据:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('   响应体解析失败');
      }
    }
  });
  
  // 控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    // 导航到注册页
    await page.goto(`${TEST_URL}/register`, {
      waitUntil: 'networkidle'
    });
    
    console.log('📍 已进入注册页面\n');
    
    // 测试数据
    const timestamp = Date.now().toString().slice(-6);
    const testUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'Test123456!'
    };
    
    console.log('📝 填写注册表单:');
    console.log(`   邮箱: ${testUser.email}`);
    console.log(`   用户名: ${testUser.username}`);
    console.log(`   密码: ${testUser.password}\n`);
    
    // 填写表单
    await page.fill('input[type="email"]', testUser.email);
    await page.waitForTimeout(500);
    
    // 清空并填写用户名（覆盖自动填充）
    const usernameInput = await page.locator('input[placeholder*="用户名"]').first();
    await usernameInput.clear();
    await usernameInput.fill(testUser.username);
    
    // 填写密码
    const passwordInputs = await page.locator('input[type="password"]').all();
    for (const input of passwordInputs) {
      await input.fill(testUser.password);
    }
    
    // 勾选协议
    await page.click('.el-checkbox');
    
    console.log('🚀 提交注册...\n');
    
    // 提交并等待响应
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/register'), { timeout: 10000 }),
      page.click('button:has-text("注册")')
    ]);
    
    // 分析结果
    console.log('\n📊 分析结果:');
    const status = response.status();
    
    if (status === 400) {
      console.log('❌ 400错误 - 请求数据格式问题');
      console.log('   可能原因:');
      console.log('   1. 缺少必需字段');
      console.log('   2. 字段验证失败');
      console.log('   3. 数据类型不匹配');
      
      // 再次获取响应体
      try {
        const body = await response.text();
        const data = JSON.parse(body);
        if (data.message) {
          console.log(`   服务器消息: ${data.message}`);
        }
        if (data.errors) {
          console.log('   验证错误:', data.errors);
        }
      } catch (e) {}
      
    } else if (status === 409) {
      console.log('⚠️ 409冲突 - 用户已存在');
    } else if (status === 201 || status === 200) {
      console.log('✅ 注册成功');
    } else if (status === 500) {
      console.log('❌ 500错误 - 服务器内部错误');
    }
    
    // 检查页面上的提示
    await page.waitForTimeout(2000);
    const messages = await page.evaluate(() => {
      const msgs = [];
      document.querySelectorAll('.el-message').forEach(el => {
        msgs.push(el.textContent.trim());
      });
      return msgs;
    });
    
    if (messages.length > 0) {
      console.log('\n📋 页面提示消息:');
      messages.forEach(msg => {
        console.log(`   - ${msg}`);
      });
    }
    
    // 保持浏览器打开以查看
    console.log('\n⏸️ 浏览器保持打开10秒...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 诊断完成');
  }
}

// 运行测试
testRegisterIssue().catch(console.error);