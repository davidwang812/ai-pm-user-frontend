// 检查JavaScript加载和执行

import { chromium } from '@playwright/test';

async function checkJSLoading() {
  console.log('🔍 检查JavaScript加载状态...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // 启用JavaScript覆盖率
    await page.coverage.startJSCoverage();
    
    // 监听网络请求
    const jsRequests = [];
    page.on('request', request => {
      if (request.url().endsWith('.js')) {
        jsRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    // 监听响应
    const jsResponses = [];
    page.on('response', response => {
      if (response.url().endsWith('.js')) {
        jsResponses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      }
    });
    
    console.log('📍 访问网站...');
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    // 等待更长时间
    console.log('⏳ 等待JavaScript执行...');
    await page.waitForTimeout(10000);
    
    // 获取JavaScript覆盖率
    const jsCoverage = await page.coverage.stopJSCoverage();
    
    console.log('\n📜 JavaScript文件请求:');
    jsRequests.forEach(req => {
      console.log(`- ${req.method} ${req.url}`);
    });
    
    console.log('\n📊 JavaScript文件响应:');
    jsResponses.forEach(res => {
      const fileName = res.url.split('/').pop();
      console.log(`- ${fileName}: ${res.status} ${res.status === 200 ? '✅' : '❌'}`);
      if (res.headers['content-type']) {
        console.log(`  Content-Type: ${res.headers['content-type']}`);
      }
    });
    
    console.log('\n📈 JavaScript执行覆盖率:');
    jsCoverage.forEach(entry => {
      const url = entry.url;
      if (url.includes('ai-pm-user-frontend')) {
        const usedBytes = entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
        const totalBytes = entry.text.length;
        const coverage = ((usedBytes / totalBytes) * 100).toFixed(2);
        console.log(`- ${url.split('/').pop()}: ${coverage}% 已执行`);
      }
    });
    
    // 检查Vue应用状态
    const appState = await page.evaluate(() => {
      const checkVue = () => {
        const app = document.querySelector('#app');
        return {
          // Vue 3检查
          hasVue3App: !!(app && app.__vue_app__),
          hasVue3Global: !!(window.Vue || window.vue),
          // 检查是否有Vue组件
          hasVueComponents: document.querySelectorAll('[data-v-]').length > 0,
          // 检查路由
          currentPath: window.location.hash || window.location.pathname,
          // 检查模块
          hasModules: 'noModule' in document.createElement('script'),
          // 错误信息
          lastError: window.__lastError || null
        };
      };
      
      // 设置错误捕获
      window.addEventListener('error', (e) => {
        window.__lastError = e.message;
      });
      
      return checkVue();
    });
    
    console.log('\n🎯 Vue应用状态:');
    console.log('- Vue 3 App实例:', appState.hasVue3App ? '存在' : '不存在');
    console.log('- Vue 3全局对象:', appState.hasVue3Global ? '存在' : '不存在');
    console.log('- Vue组件数量:', appState.hasVueComponents);
    console.log('- 当前路径:', appState.currentPath);
    console.log('- ES模块支持:', appState.hasModules ? '是' : '否');
    if (appState.lastError) {
      console.log('- 最后错误:', appState.lastError);
    }
    
    // 尝试手动初始化Vue
    console.log('\n🔧 尝试检查Vue初始化...');
    const initCheck = await page.evaluate(() => {
      // 检查是否有未捕获的Promise错误
      const errors = [];
      window.addEventListener('unhandledrejection', event => {
        errors.push(event.reason.toString());
      });
      
      // 等待一下看是否有错误
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            promiseErrors: errors,
            consoleErrors: window.__consoleErrors || []
          });
        }, 2000);
      });
    });
    
    if (initCheck.promiseErrors.length > 0) {
      console.log('\n❌ Promise错误:');
      initCheck.promiseErrors.forEach(err => console.log(`- ${err}`));
    }
    
    // 检查网络标签页的错误
    console.log('\n🌐 检查加载的资源...');
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name.split('/').pop(),
        type: entry.initiatorType,
        duration: Math.round(entry.duration),
        size: entry.transferSize,
        status: entry.responseEnd > 0 ? 'loaded' : 'failed'
      }));
    });
    
    const failedResources = resources.filter(r => r.status === 'failed');
    if (failedResources.length > 0) {
      console.log('\n❌ 加载失败的资源:');
      failedResources.forEach(r => console.log(`- ${r.name} (${r.type})`));
    }
    
    // 截个图
    await page.screenshot({ 
      path: 'test-results/screenshots/js-check.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 检查完成!');
}

checkJSLoading();