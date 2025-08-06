// 调试Vue应用加载错误

import { chromium } from '@playwright/test';

async function debugErrors() {
  console.log('🔍 开始错误调试...\n');
  
  const browser = await chromium.launch({
    headless: false, // 显示浏览器
    devtools: true  // 打开开发者工具
  });
  
  try {
    const page = await browser.newPage();
    
    // 收集所有控制台消息
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleLogs.push(logEntry);
      
      // 实时输出
      const prefix = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : '📝';
      console.log(`${prefix} [${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // 捕获页面错误
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.error('🚨 页面错误:', error.message);
    });
    
    // 捕获请求失败
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      });
      console.error('❌ 请求失败:', request.url());
    });
    
    // 监听响应
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`❌ HTTP ${response.status()}: ${response.url()}`);
      }
    });
    
    console.log('📍 访问网站...');
    const response = await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log(`\n📊 页面加载状态: ${response.status()}`);
    
    // 等待一段时间让错误出现
    await page.waitForTimeout(5000);
    
    // 检查Vue是否加载
    const vueStatus = await page.evaluate(() => {
      return {
        hasVue: typeof Vue !== 'undefined',
        hasApp: !!document.querySelector('#app'),
        appContent: document.querySelector('#app')?.innerHTML || '',
        hasVueDevtools: !!(window.__VUE__ || window.__VUE_DEVTOOLS_GLOBAL_HOOK__),
        scripts: Array.from(document.scripts).map(s => ({
          src: s.src,
          loaded: !s.src || s.complete,
          async: s.async,
          defer: s.defer
        }))
      };
    });
    
    console.log('\n🔧 Vue状态检查:');
    console.log('- Vue全局对象:', vueStatus.hasVue ? '存在' : '不存在');
    console.log('- #app元素:', vueStatus.hasApp ? '存在' : '不存在');
    console.log('- Vue Devtools:', vueStatus.hasVueDevtools ? '可用' : '不可用');
    console.log('- App内容长度:', vueStatus.appContent.length, '字符');
    
    console.log('\n📜 脚本加载状态:');
    vueStatus.scripts.forEach((script, i) => {
      if (script.src) {
        console.log(`${i + 1}. ${script.loaded ? '✅' : '❌'} ${script.src.split('/').pop()}`);
      }
    });
    
    // 检查网络错误
    const networkErrors = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.responseEnd === 0 || entry.transferSize === 0)
        .map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration
        }));
    });
    
    if (networkErrors.length > 0) {
      console.log('\n❌ 网络加载失败的资源:');
      networkErrors.forEach(err => {
        console.log(`- ${err.name.split('/').pop()} (${err.type})`);
      });
    }
    
    // 尝试手动检查路由
    await page.evaluate(() => {
      console.log('尝试访问路由...');
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    });
    
    await page.waitForTimeout(3000);
    
    // 最终报告
    console.log('\n📋 错误汇总:');
    console.log(`- 控制台错误: ${consoleLogs.filter(l => l.type === 'error').length} 个`);
    console.log(`- 页面错误: ${pageErrors.length} 个`);
    console.log(`- 请求失败: ${failedRequests.length} 个`);
    
    if (pageErrors.length > 0) {
      console.log('\n页面错误详情:');
      pageErrors.forEach(err => console.log(`- ${err}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n失败请求详情:');
      failedRequests.forEach(req => {
        console.log(`- ${req.method} ${req.url}`);
        console.log(`  原因: ${req.failure?.errorText}`);
      });
    }
    
    // 保存页面源码
    const html = await page.content();
    console.log('\n💾 保存页面源码到: test-results/page-source.html');
    const fs = await import('fs');
    fs.writeFileSync('test-results/page-source.html', html);
    
    console.log('\n⏸️  浏览器将保持打开状态，请检查开发者工具...');
    console.log('按 Ctrl+C 结束程序');
    
    // 保持浏览器打开
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugErrors();