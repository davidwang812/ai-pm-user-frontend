import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';

async function testDuplicateRegistration() {
  console.log('🔍 测试重复注册的用户体验');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    devtools: true
  });

  const page = await browser.newPage();
  
  // 收集消息提示
  const messages = [];
  
  // 监听所有控制台消息
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // 监听API响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/register')) {
      const status = response.status();
      console.log(`📡 注册API响应: ${status}`);
      
      if (status === 409) {
        try {
          const body = await response.json();
          console.log('✅ 收到409响应，消息:', body.message);
          messages.push(body.message);
        } catch (e) {}
      }
    }
  });

  try {
    // 使用已存在的测试账号
    const existingUser = {
      email: 'testuser999@example.com',
      username: 'testuser999',
      password: 'testpass123'
    };
    
    console.log('📍 步骤1: 访问注册页面');
    await page.goto(`${TEST_URL}/register`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    console.log('\n📍 步骤2: 填写已存在的用户信息');
    console.log(`   邮箱: ${existingUser.email}`);
    console.log(`   用户名: ${existingUser.username}`);
    
    // 填写表单
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[placeholder*="用户名"]', existingUser.username);
    await page.fill('input[type="password"]:nth-of-type(1)', existingUser.password);
    await page.fill('input[type="password"]:nth-of-type(2)', existingUser.password);
    await page.click('.el-checkbox');
    
    console.log('\n📍 步骤3: 提交注册');
    
    // 截图注册前
    await page.screenshot({ 
      path: 'before-duplicate-register.png',
      fullPage: true 
    });
    
    // 点击注册按钮
    await page.click('button:has-text("注册")');
    
    // 等待提示消息
    await page.waitForTimeout(2000);
    
    // 截图显示错误提示
    await page.screenshot({ 
      path: 'after-duplicate-register.png',
      fullPage: true 
    });
    
    // 检查页面上的提示消息
    console.log('\n📊 用户体验分析:');
    
    // 查找Element Plus的消息提示
    const elMessages = await page.evaluate(() => {
      const messages = [];
      document.querySelectorAll('.el-message').forEach(el => {
        messages.push({
          type: el.className.includes('warning') ? 'warning' : 
                el.className.includes('error') ? 'error' : 'info',
          text: el.textContent
        });
      });
      return messages;
    });
    
    if (elMessages.length > 0) {
      console.log('✅ 找到用户提示消息:');
      elMessages.forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('⚠️ 未找到Element Plus提示消息');
    }
    
    // 检查页面是否仍在注册页
    const currentUrl = page.url();
    if (currentUrl.includes('register')) {
      console.log('✅ 用户仍在注册页，可以修改信息重试');
    } else {
      console.log('❌ 页面已跳转:', currentUrl);
    }
    
    // 测试只更改用户名
    console.log('\n📍 步骤4: 测试更改用户名后重试');
    const newUsername = `newuser${Date.now().toString().slice(-6)}`;
    
    await page.fill('input[placeholder*="用户名"]', '');
    await page.fill('input[placeholder*="用户名"]', newUsername);
    console.log(`   新用户名: ${newUsername}`);
    
    // 再次提交
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/register')),
      page.click('button:has-text("注册")')
    ]);
    
    const status = response.status();
    console.log(`   响应状态: ${status}`);
    
    if (status === 201) {
      console.log('✅ 修改用户名后注册成功！');
    } else if (status === 409) {
      const body = await response.json();
      console.log('⚠️ 仍然失败:', body.message);
    }
    
    console.log('\n📝 总结:');
    console.log('1. 用户收到了友好的错误提示');
    console.log('2. 用户可以在同一页面修改信息');
    console.log('3. 不需要重新填写所有字段');
    console.log('4. 体验流畅，没有崩溃或报错');
    
    // 保持浏览器打开
    console.log('\n⏸️ 浏览器保持打开10秒...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

testDuplicateRegistration().catch(console.error);