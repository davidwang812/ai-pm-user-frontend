// 测试Vue应用加载

import { chromium } from '@playwright/test';

async function testVueApp() {
  console.log('🚀 测试Vue应用...\n');
  
  const browser = await chromium.launch({
    headless: false, // 打开浏览器界面
    slowMo: 100 // 慢速执行，便于观察
  });
  
  try {
    const page = await browser.newPage();
    
    // 打开浏览器控制台
    page.on('console', msg => {
      console.log(`浏览器控制台 [${msg.type()}]:`, msg.text());
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.error('页面错误:', error.message);
    });
    
    console.log('📍 访问网站...');
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });
    
    console.log('⏳ 等待Vue应用加载...');
    
    // 等待Vue应用挂载
    try {
      await page.waitForFunction(() => {
        return window.Vue || document.querySelector('#app').__vue_app__;
      }, { timeout: 30000 });
      console.log('✅ Vue应用已加载');
    } catch {
      console.log('⚠️  Vue应用加载超时');
    }
    
    // 等待路由加载
    await page.waitForTimeout(5000);
    
    // 检查页面内容
    const pageContent = await page.evaluate(() => {
      const app = document.querySelector('#app');
      return {
        hasContent: app.children.length > 0,
        innerHTML: app.innerHTML.substring(0, 200),
        childCount: app.children.length,
        classList: Array.from(app.classList)
      };
    });
    
    console.log('\n📄 页面内容:');
    console.log('- 有内容:', pageContent.hasContent);
    console.log('- 子元素数:', pageContent.childCount);
    console.log('- CSS类:', pageContent.classList);
    console.log('- HTML预览:', pageContent.innerHTML + '...');
    
    // 尝试找到路由视图
    const hasRouterView = await page.locator('router-view, [data-v-]').count() > 0;
    console.log('- 路由视图:', hasRouterView ? '存在' : '不存在');
    
    // 检查是否有加载中的提示
    const loadingElements = await page.locator('.loading, .el-loading, .spinner').count();
    console.log('- 加载提示:', loadingElements > 0 ? `有${loadingElements}个` : '无');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/vue-app-loaded.png',
      fullPage: true 
    });
    console.log('\n📸 截图已保存');
    
    // 尝试直接访问登录页
    console.log('\n🔄 直接访问登录页...');
    await page.goto('https://ai-pm-user-frontend.vercel.app/#/login', {
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // 再次截图
    await page.screenshot({ 
      path: 'test-results/screenshots/login-page.png',
      fullPage: true 
    });
    
    // 检查登录页元素
    const loginElements = {
      form: await page.locator('form').count(),
      emailInput: await page.locator('input[type="email"], input[type="text"]').count(),
      passwordInput: await page.locator('input[type="password"]').count(),
      submitButton: await page.locator('button[type="submit"], button').count()
    };
    
    console.log('\n🔍 登录页元素:');
    console.log('- 表单:', loginElements.form);
    console.log('- 邮箱输入框:', loginElements.emailInput);
    console.log('- 密码输入框:', loginElements.passwordInput);
    console.log('- 提交按钮:', loginElements.submitButton);
    
    console.log('\n⏸️  保持浏览器打开10秒供查看...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 测试完成!');
}

testVueApp();