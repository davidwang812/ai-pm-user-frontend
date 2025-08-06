// 快速测试脚本 - 验证网站可访问性

import { chromium } from '@playwright/test';

async function quickTest() {
  console.log('🚀 开始快速测试...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // 测试首页
    console.log('📍 访问首页...');
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 30000
    });
    
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 检查关键元素
    console.log('\n🔍 检查页面元素...');
    
    const elements = [
      { selector: '#app', name: 'Vue应用根元素' },
      { selector: '.el-button', name: 'Element Plus按钮' },
      { selector: '[href*="login"]', name: '登录链接' }
    ];
    
    for (const elem of elements) {
      try {
        await page.waitForSelector(elem.selector, { timeout: 5000 });
        console.log(`✅ 找到 ${elem.name}`);
      } catch {
        console.log(`❌ 未找到 ${elem.name}`);
      }
    }
    
    // 截图
    console.log('\n📸 保存截图...');
    await page.screenshot({ 
      path: 'test-results/screenshots/homepage.png',
      fullPage: true 
    });
    console.log('✅ 截图已保存');
    
    // 测试导航到登录页
    console.log('\n🔄 导航到登录页...');
    await page.click('text=登录');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('✅ 成功导航到登录页');
    
    // 检查登录表单
    const hasEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    
    console.log(`✅ 邮箱输入框: ${hasEmailInput ? '存在' : '不存在'}`);
    console.log(`✅ 密码输入框: ${hasPasswordInput ? '存在' : '不存在'}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 测试完成!');
}

quickTest();