import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const timestamp = String(Date.now()).slice(-6);
const testEmail = `test${timestamp}@example.com`;
const testUsername = `user${timestamp}`;
const testPassword = 'Test123456!';

console.log('🚀 Vue Router 测试');
console.log(`📧 邮箱: ${testEmail}`);
console.log(`👤 用户名: ${testUsername}`);
console.log('================================\n');

async function test() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // 监听所有网络请求
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 API请求: ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`   数据: ${request.postData()}`);
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 API响应: ${response.status()} ${response.url()}`);
      try {
        const body = await response.json();
        console.log(`   响应: ${JSON.stringify(body, null, 2)}`);
      } catch (e) {}
    }
  });

  try {
    // 步骤1: 访问首页
    console.log('📍 访问首页');
    await page.goto(TEST_URL);
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   当前URL: ${currentUrl}`);
    
    // 步骤2: 查找并点击注册
    console.log('\n📍 查找注册入口');
    
    // 检查是否已经在登录页
    if (currentUrl.includes('login')) {
      console.log('   当前在登录页，查找注册链接');
      
      // 查找"立即注册"或"注册账号"链接
      const registerLink = await page.locator('a:has-text("注册"), span:has-text("注册"), button:has-text("注册")').first();
      if (await registerLink.isVisible()) {
        console.log('   点击注册链接');
        await registerLink.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 步骤3: 检查是否到达注册页面
    console.log('\n📍 检查注册页面');
    const newUrl = page.url();
    console.log(`   当前URL: ${newUrl}`);
    
    // 查找注册表单元素
    const hasRegisterForm = await page.locator('text="注册账号", text="用户注册", text="创建账号"').count() > 0;
    console.log(`   找到注册标题: ${hasRegisterForm}`);
    
    // 步骤4: 填写表单
    console.log('\n📍 填写注册表单');
    
    // 邮箱
    const emailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);
      console.log('   ✅ 填写邮箱');
      await page.waitForTimeout(500);
    }
    
    // 用户名 - 先检查自动填充，然后修改
    const usernameInput = await page.locator('input[placeholder*="用户名"], input[name="username"]').first();
    if (await usernameInput.isVisible()) {
      const currentUsername = await usernameInput.inputValue();
      if (currentUsername) {
        console.log(`   自动填充用户名: ${currentUsername}`);
      }
      await usernameInput.clear();
      await usernameInput.fill(testUsername);
      console.log(`   ✅ 设置用户名: ${testUsername}`);
    }
    
    // 密码 - 查找所有密码输入框
    const passwordInputs = await page.locator('input[type="password"]').all();
    console.log(`   找到 ${passwordInputs.length} 个密码输入框`);
    
    if (passwordInputs.length >= 2) {
      // 第一个是密码
      await passwordInputs[0].fill(testPassword);
      console.log('   ✅ 填写密码');
      
      // 第二个是确认密码
      await passwordInputs[1].fill(testPassword);
      console.log('   ✅ 填写确认密码');
    } else if (passwordInputs.length === 1) {
      // 只有一个密码框的情况
      await passwordInputs[0].fill(testPassword);
      console.log('   ✅ 填写密码（只找到一个密码框）');
    }
    
    // 用户协议
    const checkbox = await page.locator('.el-checkbox').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
      console.log('   ✅ 勾选用户协议');
    }
    
    // 截图表单
    await page.screenshot({ 
      path: `register-form-${timestamp}.png`,
      fullPage: true 
    });
    console.log('   📸 已截图表单');
    
    // 步骤5: 提交
    console.log('\n📍 提交注册');
    
    // 查找提交按钮
    const submitButton = await page.locator('button.el-button--primary:has-text("注册"), button:has-text("立即注册")').first();
    if (await submitButton.isVisible()) {
      // 检查按钮是否可用
      const isDisabled = await submitButton.isDisabled();
      if (isDisabled) {
        console.log('   ⚠️ 注册按钮被禁用');
        
        // 检查哪个字段有问题
        const formErrors = await page.locator('.el-form-item__error').allTextContents();
        if (formErrors.length > 0) {
          console.log('   表单错误:');
          formErrors.forEach(err => console.log(`     - ${err}`));
        }
      } else {
        console.log('   点击注册按钮...');
        
        // 监听响应
        const responsePromise = page.waitForResponse(
          resp => resp.url().includes('/api/') && resp.url().includes('register'),
          { timeout: 10000 }
        ).catch(() => null);
        
        await submitButton.click();
        
        const response = await responsePromise;
        if (response) {
          console.log(`   收到响应: ${response.status()}`);
        } else {
          console.log('   未收到API响应，等待3秒...');
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('   ❌ 未找到注册按钮');
      
      // 输出所有按钮文本用于调试
      const allButtons = await page.locator('button').allTextContents();
      console.log('   页面上的按钮:');
      allButtons.forEach(btn => {
        if (btn.trim()) console.log(`     - "${btn.trim()}"`);
      });
    }
    
    // 步骤6: 检查结果
    console.log('\n📍 检查结果');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    console.log(`   最终URL: ${finalUrl}`);
    
    // 检查消息提示
    const messages = await page.locator('.el-message, .el-notification').allTextContents();
    if (messages.length > 0) {
      console.log('   消息提示:');
      messages.forEach(msg => console.log(`     - ${msg}`));
    }
    
    // 截图最终状态
    await page.screenshot({ 
      path: `register-result-${timestamp}.png`,
      fullPage: true 
    });
    console.log('   📸 已截图结果');
    
    // 保持浏览器打开
    console.log('\n⏸️ 浏览器保持打开10秒...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

test().catch(console.error);