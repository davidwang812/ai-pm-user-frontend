// 简化的测试脚本 - 专注于捕获错误
import { chromium } from 'playwright';
import fs from 'fs';

async function simpleTest() {
  console.log('🎭 启动简化测试...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  const page = await browser.newPage();
  
  // 收集所有日志
  const logs = {
    console: [],
    errors: [],
    network: []
  };
  
  // 监听控制台
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString()
    };
    logs.console.push(log);
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // 监听错误
  page.on('pageerror', error => {
    logs.errors.push({
      message: error.message,
      time: new Date().toISOString()
    });
    console.log(`[ERROR] ${error.message}`);
  });
  
  // 监听网络
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      logs.network.push({
        url: response.url(),
        status: response.status(),
        time: new Date().toISOString()
      });
      console.log(`[API] ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // 1. 访问注册页
    console.log('\n📍 访问注册页面...');
    await page.goto('https://ai-pm-user-frontend.vercel.app/register');
    await page.waitForTimeout(3000);
    
    // 2. 检查页面状态
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasApp: !!document.querySelector('#app'),
        hasForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        url: window.location.href
      };
    });
    
    console.log('\n📊 页面状态:');
    console.log(JSON.stringify(pageInfo, null, 2));
    
    // 3. 尝试注册
    if (pageInfo.hasEmailInput && pageInfo.hasPasswordInput) {
      console.log('\n📍 填写表单...');
      const timestamp = Date.now();
      
      await page.fill('input[type="email"]', `test${timestamp}@example.com`);
      await page.fill('input[placeholder*="用户名"]', `user${timestamp}`);
      await page.fill('input[type="password"]:nth-of-type(1)', 'Test123456!');
      
      // 填写确认密码
      const confirmPwd = await page.$('input[type="password"]:nth-of-type(2)');
      if (confirmPwd) {
        await page.fill('input[type="password"]:nth-of-type(2)', 'Test123456!');
      }
      
      console.log('✅ 表单已填写');
      
      // 提交
      const submitBtn = await page.$('button[type="submit"], button:has-text("注册")');
      if (submitBtn) {
        console.log('\n📍 点击注册按钮...');
        await submitBtn.click();
        await page.waitForTimeout(5000);
        
        // 检查结果
        const afterSubmit = await page.evaluate(() => {
          const errorMsg = document.querySelector('.el-message--error');
          const successMsg = document.querySelector('.el-message--success');
          return {
            hasError: !!errorMsg,
            errorText: errorMsg?.textContent,
            hasSuccess: !!successMsg,
            successText: successMsg?.textContent,
            currentUrl: window.location.href
          };
        });
        
        console.log('\n📊 提交结果:');
        console.log(JSON.stringify(afterSubmit, null, 2));
      }
    }
    
    // 4. 测试API连接
    console.log('\n📍 测试API连接...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://aiproductmanager-production.up.railway.app/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'apitest@example.com',
            username: 'apitest',
            password: 'Test123456!'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API测试结果:', JSON.stringify(apiTest, null, 2));
    
  } catch (error) {
    console.error('测试错误:', error);
  }
  
  // 保存日志
  fs.writeFileSync('test-results/simple-test-logs.json', JSON.stringify(logs, null, 2));
  console.log('\n📁 日志已保存到: test-results/simple-test-logs.json');
  
  await browser.close();
  console.log('✅ 测试完成');
}

// 确保目录存在
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

simpleTest().catch(console.error);