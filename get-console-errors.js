// 获取浏览器控制台错误信息

import { chromium } from '@playwright/test';

async function getConsoleErrors() {
  console.log('🔍 获取浏览器控制台信息...\n');
  
  const browser = await chromium.launch({
    headless: false, // 显示浏览器
    devtools: true   // 打开开发者工具
  });
  
  try {
    const page = await browser.newPage();
    
    // 收集所有控制台消息
    const consoleLogs = [];
    
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      // 获取详细的错误信息
      let args = [];
      try {
        for (const arg of msg.args()) {
          args.push(await arg.jsonValue());
        }
      } catch (e) {
        args = ['[无法解析参数]'];
      }
      
      consoleLogs.push({
        type,
        text,
        location,
        args,
        timestamp: new Date().toISOString()
      });
      
      // 实时输出到终端
      const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📝';
      console.log(`${icon} [${type.toUpperCase()}] ${text}`);
      
      if (location.url) {
        console.log(`   位置: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
      
      if (type === 'error' && args.length > 0) {
        console.log(`   详细信息:`, args);
      }
      
      console.log(''); // 空行分隔
    });
    
    // 捕获页面错误
    page.on('pageerror', error => {
      console.error('🚨 页面错误:', error.message);
      console.error('   堆栈:', error.stack);
      console.log('');
    });
    
    // 注入错误监听脚本
    await page.evaluateOnNewDocument(() => {
      // 捕获所有错误
      window.addEventListener('error', (e) => {
        console.error('Window Error:', e.message, {
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          error: e.error
        });
      });
      
      // 捕获Promise错误
      window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled Promise Rejection:', e.reason);
      });
      
      // 重写console.error以获取更多信息
      const originalError = console.error;
      console.error = function(...args) {
        originalError.apply(console, ['[Console.error]', ...args]);
      };
    });
    
    console.log('📍 访问网站: https://ai-pm-user-frontend.vercel.app\n');
    console.log('⏳ 等待页面加载和错误出现...\n');
    
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });
    
    // 等待错误出现
    await page.waitForTimeout(10000);
    
    // 在浏览器中执行诊断脚本
    const diagnostics = await page.evaluate(() => {
      const results = {
        errors: [],
        vueInfo: {},
        moduleInfo: {},
        performance: {}
      };
      
      // 检查Vue相关
      results.vueInfo = {
        hasVue: typeof Vue !== 'undefined',
        hasVueApp: !!document.querySelector('#app')?.__vue_app__,
        appElement: !!document.querySelector('#app'),
        appContent: document.querySelector('#app')?.innerHTML?.length || 0
      };
      
      // 检查模块加载
      results.moduleInfo = {
        scriptsCount: document.scripts.length,
        failedScripts: Array.from(document.scripts)
          .filter(s => s.src && !s.complete)
          .map(s => s.src),
        moduleSupport: 'noModule' in document.createElement('script')
      };
      
      // 性能信息
      const perfEntries = performance.getEntriesByType('resource');
      results.performance = {
        jsFiles: perfEntries
          .filter(e => e.name.endsWith('.js'))
          .map(e => ({
            name: e.name.split('/').pop(),
            duration: Math.round(e.duration),
            size: e.transferSize,
            status: e.responseEnd > 0 ? 'loaded' : 'failed'
          }))
      };
      
      return results;
    });
    
    console.log('\n📊 诊断结果:');
    console.log('Vue信息:', diagnostics.vueInfo);
    console.log('模块信息:', diagnostics.moduleInfo);
    console.log('JS文件加载:', diagnostics.performance.jsFiles);
    
    console.log('\n📋 控制台日志汇总:');
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    const warningLogs = consoleLogs.filter(log => log.type === 'warning');
    
    console.log(`- 错误: ${errorLogs.length} 个`);
    console.log(`- 警告: ${warningLogs.length} 个`);
    console.log(`- 总消息: ${consoleLogs.length} 个`);
    
    // 保存详细日志
    const fs = await import('fs');
    fs.writeFileSync('test-results/console-logs.json', JSON.stringify(consoleLogs, null, 2));
    console.log('\n💾 详细日志已保存到: test-results/console-logs.json');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/console-errors.png',
      fullPage: true 
    });
    
    console.log('\n⏸️  浏览器保持打开状态，请查看开发者工具...');
    console.log('按 Ctrl+C 关闭');
    
    // 保持浏览器打开
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 脚本执行错误:', error.message);
  }
}

getConsoleErrors();