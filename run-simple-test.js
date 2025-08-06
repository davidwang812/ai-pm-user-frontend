import { chromium } from 'playwright';

async function runSimpleTest() {
  console.log('🧪 运行简单的连接测试...\n');
  
  const browser = await chromium.launch({ 
    headless: true 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('1. 访问用户端首页...');
    await page.goto('https://ai-pm-user-frontend.vercel.app');
    
    const title = await page.title();
    console.log(`   ✅ 页面标题: ${title}`);
    
    console.log('\n2. 检查Vue应用是否加载...');
    const appElement = await page.locator('#app');
    const isVisible = await appElement.isVisible();
    console.log(`   ${isVisible ? '✅' : '❌'} Vue应用挂载点: ${isVisible ? '已加载' : '未找到'}`);
    
    console.log('\n3. 导航到登录页面...');
    await page.goto('https://ai-pm-user-frontend.vercel.app/#/login');
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/login-page.png',
      fullPage: true 
    });
    console.log('   ✅ 已保存登录页面截图');
    
    console.log('\n4. 检查登录表单元素...');
    const elements = {
      '邮箱输入框': 'input[type="email"], input[placeholder*="邮箱"]',
      '密码输入框': 'input[type="password"]',
      '登录按钮': 'button[type="submit"], button:has-text("登录")'
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      const count = await page.locator(selector).count();
      console.log(`   ${count > 0 ? '✅' : '❌'} ${name}: ${count > 0 ? '找到' : '未找到'}`);
    }
    
    console.log('\n5. 测试API健康检查...');
    const response = await page.request.get('https://ai-pm-user-frontend.vercel.app/api/health');
    const status = response.status();
    const data = await response.json();
    console.log(`   ${status === 200 ? '✅' : '❌'} API状态: ${status}`);
    console.log(`   响应数据:`, JSON.stringify(data, null, 2));
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

// 确保目录存在
import { mkdirSync } from 'fs';
try {
  mkdirSync('test-results', { recursive: true });
} catch (e) {}

runSimpleTest();