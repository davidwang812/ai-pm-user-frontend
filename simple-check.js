// 简单检查脚本

import { chromium } from '@playwright/test';

async function simpleCheck() {
  console.log('🔍 简单检查开始...\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // 捕获所有控制台输出
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 捕获页面错误
    page.on('pageerror', error => {
      console.error('页面错误:', error.message);
    });
    
    console.log('访问网站...');
    await page.goto('https://ai-pm-user-frontend.vercel.app');
    
    // 等待10秒让所有内容加载
    console.log('等待加载...');
    await page.waitForTimeout(10000);
    
    // 执行简单检查
    const result = await page.evaluate(() => {
      const app = document.querySelector('#app');
      return {
        appExists: !!app,
        appChildren: app ? app.children.length : 0,
        appHTML: app ? app.innerHTML.length : 0,
        hasError: document.body.textContent.includes('error') || document.body.textContent.includes('Error'),
        bodyText: document.body.textContent.trim().substring(0, 200)
      };
    });
    
    console.log('\n检查结果:');
    console.log('- App元素存在:', result.appExists);
    console.log('- App子元素数:', result.appChildren);
    console.log('- App HTML长度:', result.appHTML);
    console.log('- 有错误信息:', result.hasError);
    console.log('- 页面文本:', result.bodyText || '(空)');
    
    // 截图
    await page.screenshot({ path: 'test-results/screenshots/simple-check.png' });
    console.log('\n截图已保存');
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

simpleCheck();