// 最终测试脚本 - 验证表单修复
import { chromium } from 'playwright';
import fs from 'fs';

async function finalTest() {
  console.log('🎭 启动最终测试验证...\n');
  
  const browser = await chromium.launch({
    headless: true,
    slowMo: 50
  });
  
  const page = await browser.newPage();
  
  // 日志收集
  const testResults = {
    formElements: {},
    apiCalls: [],
    errors: [],
    success: false
  };
  
  // 监听控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.errors.push(msg.text());
      console.log(`❌ 错误: ${msg.text()}`);
    }
  });
  
  // 监听API调用
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const apiCall = {
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      };
      testResults.apiCalls.push(apiCall);
      console.log(`📡 API: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // 1. 访问注册页面
    console.log('📍 Step 1: 访问注册页面');
    await page.goto('https://ai-pm-user-frontend.vercel.app/register', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // 2. 检查表单元素（使用多种选择器）
    console.log('\n📍 Step 2: 检查表单元素');
    
    const selectors = {
      email: [
        'input[type="email"]',
        'input[data-testid="register-email"]',
        'input[placeholder*="邮箱"]',
        '.el-input input[type="email"]'
      ],
      username: [
        'input[data-testid="register-username"]',
        'input[placeholder*="用户名"]'
      ],
      password: [
        'input[data-testid="register-password"]',
        'input[type="password"]:first-of-type'
      ],
      confirmPassword: [
        'input[data-testid="register-confirm-password"]',
        'input[type="password"]:nth-of-type(2)'
      ],
      submitButton: [
        'button[data-testid="register-submit"]',
        'button.el-button--primary',
        'button:has-text("注册")'
      ]
    };
    
    // 检查每个元素
    for (const [field, selectorList] of Object.entries(selectors)) {
      let found = false;
      for (const selector of selectorList) {
        const element = await page.$(selector);
        if (element) {
          found = true;
          testResults.formElements[field] = true;
          console.log(`  ✅ ${field}: 找到 (${selector})`);
          break;
        }
      }
      if (!found) {
        testResults.formElements[field] = false;
        console.log(`  ❌ ${field}: 未找到`);
      }
    }
    
    // 3. 如果所有元素都找到，进行注册测试
    const allElementsFound = Object.values(testResults.formElements).every(v => v);
    
    if (allElementsFound) {
      console.log('\n📍 Step 3: 填写并提交表单');
      
      const timestamp = Date.now();
      const testData = {
        email: `test${timestamp}@example.com`,
        username: `user${timestamp}`,
        password: 'Test123456!'
      };
      
      console.log(`  📧 Email: ${testData.email}`);
      console.log(`  👤 Username: ${testData.username}`);
      
      // 填写表单
      await page.fill('input[type="email"], input[data-testid="register-email"]', testData.email);
      await page.fill('input[data-testid="register-username"], input[placeholder*="用户名"]', testData.username);
      await page.fill('input[data-testid="register-password"], input[type="password"]:first-of-type', testData.password);
      await page.fill('input[data-testid="register-confirm-password"], input[type="password"]:nth-of-type(2)', testData.password);
      
      // 勾选协议
      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox) {
        await checkbox.check();
      }
      
      // 截图
      await page.screenshot({ path: 'screenshots/form-filled-final.png' });
      
      // 提交表单
      console.log('\n📍 Step 4: 提交注册');
      
      // 等待响应
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/register'),
        { timeout: 10000 }
      ).catch(() => null);
      
      await page.click('button[data-testid="register-submit"], button.el-button--primary');
      
      const response = await responsePromise;
      
      if (response) {
        const status = response.status();
        console.log(`  📡 响应状态: ${status}`);
        
        if (status === 200 || status === 201) {
          testResults.success = true;
          console.log('  ✅ 注册成功！');
          
          // 尝试获取响应数据
          try {
            const data = await response.json();
            console.log(`  📦 响应数据: ${JSON.stringify(data, null, 2)}`);
          } catch (e) {
            // 忽略JSON解析错误
          }
        } else {
          console.log('  ❌ 注册失败');
        }
      } else {
        console.log('  ⚠️ 未收到API响应');
      }
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/result-final.png' });
      
    } else {
      console.log('\n❌ 表单元素不完整，无法进行注册测试');
    }
    
    // 4. 生成测试报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));
    
    console.log('\n✅ 表单元素检查:');
    for (const [field, found] of Object.entries(testResults.formElements)) {
      console.log(`  ${field}: ${found ? '✅' : '❌'}`);
    }
    
    console.log('\n📡 API调用:');
    if (testResults.apiCalls.length > 0) {
      testResults.apiCalls.forEach(call => {
        console.log(`  ${call.method} ${call.status} ${call.url}`);
      });
    } else {
      console.log('  无API调用');
    }
    
    console.log('\n🎯 最终结果:');
    if (testResults.success) {
      console.log('  ✅ 测试通过 - 注册功能正常');
    } else if (allElementsFound) {
      console.log('  ⚠️ 表单元素正常但注册未成功');
    } else {
      console.log('  ❌ 表单元素缺失');
    }
    
    // 保存结果
    fs.writeFileSync('test-results/final-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n📁 详细结果已保存到: test-results/final-test-results.json');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    testResults.errors.push(error.message);
  }
  
  await browser.close();
  console.log('\n✅ 测试完成');
  
  // 返回测试是否成功
  return testResults.success;
}

// 运行测试
finalTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });