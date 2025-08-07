import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';
const timestamp = Date.now().toString().slice(-6);

async function quickAnalysis() {
  console.log('🔍 快速诊断测试');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: true, // 无头模式更快
    devtools: false
  });

  const page = await browser.newPage();
  
  // 收集所有日志
  const logs = { console: [], errors: [], network: [] };
  
  page.on('console', msg => {
    const log = { type: msg.type(), text: msg.text() };
    logs.console.push(log);
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
      logs.errors.push(log);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
    logs.errors.push({ message: error.message });
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/register')) {
      const status = response.status();
      console.log(`📡 注册API响应: ${status}`);
      
      try {
        const body = await response.text();
        const data = JSON.parse(body);
        console.log('响应数据:', data);
        logs.network.push({ url, status, body: data });
      } catch (e) {
        console.log('无法解析响应');
      }
    }
  });

  try {
    // 1. 直接访问注册页
    console.log('📍 访问注册页面...');
    await page.goto(`${TEST_URL}/register`, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log(`URL: ${page.url()}`);
    
    // 2. 快速填写表单
    console.log('\n📍 填写注册表单...');
    
    const testData = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'Test123456!'
    };
    
    // 直接填写，不模拟延迟
    await page.fill('input[data-testid="register-email"], input[type="email"]', testData.email);
    console.log(`✅ 邮箱: ${testData.email}`);
    
    await page.fill('input[data-testid="register-username"], input[placeholder*="用户名"]', testData.username);
    console.log(`✅ 用户名: ${testData.username}`);
    
    await page.fill('input[data-testid="register-password"], input[type="password"]:nth-of-type(1)', testData.password);
    await page.fill('input[data-testid="register-confirm-password"], input[type="password"]:nth-of-type(2)', testData.password);
    console.log('✅ 密码已填写');
    
    await page.click('.el-checkbox, input[type="checkbox"]');
    console.log('✅ 勾选协议');
    
    // 3. 提交注册
    console.log('\n📍 提交注册...');
    
    // 监听API响应
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/register'),
      { timeout: 10000 }
    );
    
    // 点击注册按钮
    await page.click('button[data-testid="register-submit"], button:has-text("注册")');
    
    // 等待响应
    const response = await responsePromise.catch(() => null);
    
    if (response) {
      const status = response.status();
      const body = await response.text();
      
      console.log(`\n📊 注册结果:`);
      console.log(`状态码: ${status}`);
      
      try {
        const data = JSON.parse(body);
        console.log('响应内容:', JSON.stringify(data, null, 2));
        
        if (status === 200 || status === 201) {
          console.log('✅ 注册成功！');
        } else if (status === 400) {
          console.log('❌ 请求参数错误');
          console.log('错误信息:', data.message || data.error);
        } else if (status === 500) {
          console.log('❌ 服务器内部错误');
        }
      } catch (e) {
        console.log('响应体:', body);
      }
    } else {
      console.log('⚠️ 未收到响应或超时');
    }
    
    // 4. 分析收集的日志
    console.log('\n📋 日志分析:');
    console.log(`控制台日志: ${logs.console.length} 条`);
    console.log(`错误: ${logs.errors.length} 条`);
    
    if (logs.errors.length > 0) {
      console.log('\n错误列表:');
      logs.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text || err.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

quickAnalysis().catch(console.error);