import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const timestamp = Date.now();
const shortTimestamp = String(timestamp).slice(-6); // 只取最后6位
const testEmail = `test.${shortTimestamp}@example.com`;
const testUsername = `user${shortTimestamp}`; // 短用户名
const testPassword = 'Test123456!';

async function runDetailedTest() {
  console.log('🚀 启动详细测试...');
  console.log(`📧 测试邮箱: ${testEmail}`);
  console.log('================================\n');

  const browser = await chromium.launch({
    headless: true,
    devtools: false
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // 收集所有API调用
  const apiCalls = [];
  
  // 监听所有请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('aiproductmanager')) {
      console.log(`➡️ API请求: ${request.method()} ${url}`);
      apiCalls.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  // 监听所有响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('aiproductmanager')) {
      const status = response.status();
      console.log(`⬅️ API响应: ${status} ${url}`);
      
      try {
        const body = await response.text();
        if (body) {
          const parsed = JSON.parse(body);
          console.log(`   响应内容: ${JSON.stringify(parsed).substring(0, 200)}`);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  });

  // 监听控制台
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ 控制台错误: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ 控制台警告: ${msg.text()}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`💥 页面错误: ${error.message}`);
  });

  try {
    // 1. 访问首页
    console.log('\n📍 步骤1: 访问首页');
    await page.goto(TEST_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // 等待Vue应用加载
    await page.waitForTimeout(3000);
    
    // 检查当前URL
    console.log(`   当前URL: ${page.url()}`);
    
    // 检查是否有注册链接
    const hasRegisterLink = await page.locator('a:has-text("注册")').count() > 0;
    console.log(`   找到注册链接: ${hasRegisterLink}`);

    // 2. 尝试直接访问注册页面
    console.log('\n📍 步骤2: 访问注册页面');
    
    // 先检查路由
    const registerUrl = `${TEST_URL}/#/register`;
    console.log(`   尝试访问: ${registerUrl}`);
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    console.log(`   当前URL: ${page.url()}`);
    
    // 检查是否有注册表单
    const hasEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').count() > 0;
    console.log(`   找到邮箱输入框: ${hasEmailInput}`);
    
    if (!hasEmailInput) {
      // 尝试点击注册链接
      console.log('   尝试点击注册链接...');
      const registerLink = await page.locator('a:has-text("注册"), button:has-text("注册")').first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForTimeout(2000);
      }
    }

    // 3. 填写注册表单
    console.log('\n📍 步骤3: 填写注册表单');
    
    // 再次检查表单
    const emailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').first();
    if (await emailInput.isVisible()) {
      console.log('   ✅ 找到邮箱输入框');
      await emailInput.fill(testEmail);
      
      // 触发change事件
      await emailInput.press('Tab');
      await page.waitForTimeout(500);
      
      // 检查用户名是否自动填充
      const usernameInput = await page.locator('input[placeholder*="用户名"]').first();
      if (await usernameInput.isVisible()) {
        const autoFilledUsername = await usernameInput.inputValue();
        console.log(`   用户名自动填充: ${autoFilledUsername}`);
        
        // 清除并填写短用户名
        await usernameInput.clear();
        await usernameInput.fill(testUsername);
        console.log(`   修改用户名为: ${testUsername}`);
      }
      
      // 填写密码
      const passwordInputs = await page.locator('input[type="password"]').all();
      if (passwordInputs.length >= 2) {
        console.log('   ✅ 找到密码输入框');
        await passwordInputs[0].fill(testPassword);
        await passwordInputs[1].fill(testPassword);
      }
      
      // 勾选用户协议
      const agreementCheckbox = await page.locator('input[type="checkbox"], .el-checkbox__input').first();
      if (await agreementCheckbox.isVisible()) {
        await agreementCheckbox.click();
        console.log('   ✅ 勾选用户协议');
      } else {
        // 尝试点击label
        const agreementLabel = await page.locator('label:has-text("同意"), label:has-text("协议"), .el-checkbox').first();
        if (await agreementLabel.isVisible()) {
          await agreementLabel.click();
          console.log('   ✅ 点击用户协议标签');
        }
      }
      
      // 4. 提交注册
      console.log('\n📍 步骤4: 提交注册');
      
      // 设置请求监听
      const registerPromise = page.waitForResponse(
        response => {
          const url = response.url();
          return url.includes('register') || url.includes('auth');
        },
        { timeout: 10000 }
      ).catch(() => null);
      
      // 点击提交按钮
      const submitButton = await page.locator('button[type="submit"], button:has-text("注册")').first();
      if (await submitButton.isVisible()) {
        console.log('   点击注册按钮...');
        await submitButton.click();
        
        // 等待响应
        const response = await registerPromise;
        if (response) {
          console.log(`   ✅ 收到注册响应: ${response.status()}`);
          const responseBody = await response.text();
          console.log(`   响应内容: ${responseBody.substring(0, 200)}`);
        } else {
          console.log('   ⚠️ 未收到注册响应');
        }
      } else {
        console.log('   ❌ 未找到提交按钮');
      }
    } else {
      console.log('   ❌ 未找到注册表单');
      
      // 输出页面内容用于调试
      const pageContent = await page.content();
      console.log('   页面包含的文本:');
      const texts = await page.locator('body').allTextContents();
      texts.forEach(text => {
        if (text.trim()) {
          console.log(`     "${text.trim().substring(0, 50)}"`);
        }
      });
    }

    // 5. 等待并检查结果
    console.log('\n📍 步骤5: 检查结果');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`   最终URL: ${finalUrl}`);
    
    // 检查是否有错误提示
    const errorMessages = await page.locator('.el-message--error, .el-notification__content').allTextContents();
    if (errorMessages.length > 0) {
      console.log('   错误提示:');
      errorMessages.forEach(msg => console.log(`     - ${msg}`));
    }
    
    // 检查是否有成功提示
    const successMessages = await page.locator('.el-message--success').allTextContents();
    if (successMessages.length > 0) {
      console.log('   成功提示:');
      successMessages.forEach(msg => console.log(`     - ${msg}`));
    }

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  } finally {
    // 输出API调用总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 API调用总结');
    console.log('='.repeat(50));
    
    if (apiCalls.length > 0) {
      apiCalls.forEach((call, index) => {
        console.log(`\n${index + 1}. ${call.method} ${call.url}`);
        if (call.postData) {
          console.log(`   请求数据: ${call.postData.substring(0, 200)}`);
        }
      });
    } else {
      console.log('没有检测到API调用');
    }
    
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

runDetailedTest().catch(console.error);