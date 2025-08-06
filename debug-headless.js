// 无头模式调试脚本

import { chromium } from '@playwright/test';
import fs from 'fs';

async function debugHeadless() {
  console.log('🔍 开始调试Vue应用加载问题...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // 收集所有控制台消息
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // 捕获页面错误
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // 捕获请求失败
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });
    
    console.log('📍 访问网站...');
    const response = await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log(`状态码: ${response.status()}`);
    
    // 等待JavaScript执行
    await page.waitForTimeout(5000);
    
    // 检查Vue状态
    const vueCheck = await page.evaluate(() => {
      const app = document.querySelector('#app');
      return {
        hasApp: !!app,
        appHTML: app ? app.innerHTML.substring(0, 500) : '',
        hasVue: typeof Vue !== 'undefined',
        scripts: Array.from(document.scripts).map(s => ({
          src: s.src ? s.src.split('/').pop() : 'inline',
          error: s.error
        })),
        bodyClasses: document.body.className,
        documentReady: document.readyState
      };
    });
    
    console.log('\n📊 页面状态:');
    console.log('- 文档就绪状态:', vueCheck.documentReady);
    console.log('- #app存在:', vueCheck.hasApp);
    console.log('- Vue全局对象:', vueCheck.hasVue);
    console.log('- Body CSS类:', vueCheck.bodyClasses || '无');
    
    console.log('\n📜 脚本状态:');
    vueCheck.scripts.forEach(s => {
      console.log(`- ${s.src}${s.error ? ' (错误)' : ''}`);
    });
    
    if (vueCheck.appHTML) {
      console.log('\n📄 App内容预览:');
      console.log(vueCheck.appHTML);
    }
    
    // 检查控制台错误
    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('\n❌ 控制台错误:');
      errors.forEach(err => {
        console.log(`- ${err.text}`);
      });
    }
    
    // 检查失败的请求
    if (failedRequests.length > 0) {
      console.log('\n❌ 失败的请求:');
      failedRequests.forEach(req => {
        console.log(`- ${req.url}`);
        console.log(`  原因: ${req.failure?.errorText}`);
      });
    }
    
    // 尝试获取更多调试信息
    const debugInfo = await page.evaluate(() => {
      // 检查是否有错误提示
      const errorElements = document.querySelectorAll('.error, .el-alert--error, [class*="error"]');
      const errors = Array.from(errorElements).map(el => el.textContent.trim());
      
      // 检查加载状态
      const loadingElements = document.querySelectorAll('.loading, [class*="loading"]');
      
      return {
        errors: errors,
        hasLoading: loadingElements.length > 0,
        title: document.title,
        metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
          name: m.name || m.property,
          content: m.content
        })).filter(m => m.name)
      };
    });
    
    if (debugInfo.errors.length > 0) {
      console.log('\n⚠️ 页面错误提示:');
      debugInfo.errors.forEach(err => console.log(`- ${err}`));
    }
    
    console.log('\n🔍 其他信息:');
    console.log('- 页面标题:', debugInfo.title);
    console.log('- 加载指示器:', debugInfo.hasLoading ? '存在' : '不存在');
    
    // 保存页面源码
    const html = await page.content();
    fs.writeFileSync('test-results/debug-page.html', html);
    console.log('\n💾 页面源码已保存到: test-results/debug-page.html');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/debug-final.png',
      fullPage: true 
    });
    console.log('📸 截图已保存到: test-results/screenshots/debug-final.png');
    
    // 尝试直接访问API
    console.log('\n🔗 测试API连接...');
    try {
      const apiResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('https://ai-product-manager-production.up.railway.app/api/health');
          return {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText
          };
        } catch (err) {
          return { error: err.message };
        }
      });
      console.log('API响应:', apiResponse);
    } catch (err) {
      console.log('API测试失败:', err.message);
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 调试完成!');
}

debugHeadless();