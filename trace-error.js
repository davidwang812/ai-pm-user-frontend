// 追踪具体错误来源

import { chromium } from '@playwright/test';

async function traceError() {
  console.log('🔍 追踪错误来源...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // 注入错误追踪代码
    await page.addInitScript(() => {
      // 保存原始的函数
      const originalDefineProperty = Object.defineProperty;
      
      // 追踪可能的aa变量
      window.__errorTrace = [];
      
      // 监听所有错误
      window.addEventListener('error', (e) => {
        window.__errorTrace.push({
          type: 'error',
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          column: e.colno,
          stack: e.error?.stack
        });
      }, true);
      
      // 尝试捕获aa变量的定义
      try {
        Object.defineProperty(window, '__lookupGetter__', {
          value: function(prop) {
            if (prop === 'aa') {
              console.error('Attempting to access aa');
            }
            return originalDefineProperty.apply(this, arguments);
          }
        });
      } catch (e) {}
    });
    
    let errorCaptured = null;
    
    // 监听页面错误
    page.on('pageerror', error => {
      errorCaptured = {
        message: error.message,
        stack: error.stack
      };
      
      console.log('❌ 捕获到错误:', error.message);
      
      // 分析堆栈
      if (error.stack) {
        console.log('\n📍 错误堆栈分析:');
        const lines = error.stack.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('vendor-') || line.includes('element-plus')) {
            console.log(`  ${i}: ${line.trim()}`);
          }
        });
      }
    });
    
    console.log('访问页面...');
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      waitUntil: 'domcontentloaded'
    });
    
    await page.waitForTimeout(3000);
    
    // 获取错误追踪信息
    const errorInfo = await page.evaluate(() => {
      return {
        traces: window.__errorTrace || [],
        // 检查是否是Element Plus相关
        hasElementPlus: typeof ElementPlus !== 'undefined',
        // 检查加载的模块
        modules: Object.keys(window).filter(key => 
          key.startsWith('El') || key.includes('element')
        )
      };
    });
    
    console.log('\n📊 错误追踪结果:');
    console.log('- 错误记录数:', errorInfo.traces.length);
    console.log('- Element Plus加载:', errorInfo.hasElementPlus);
    console.log('- 相关模块:', errorInfo.modules);
    
    // 分析错误模式
    if (errorCaptured) {
      console.log('\n🔍 错误分析:');
      
      if (errorCaptured.message.includes('aa')) {
        console.log('这是一个变量初始化顺序问题');
        console.log('可能原因:');
        console.log('1. Element Plus与Vue的版本不兼容');
        console.log('2. 某个组件在初始化前被访问');
        console.log('3. 构建时的代码压缩问题');
      }
      
      // 检查是否是特定库的问题
      if (errorCaptured.stack.includes('element-plus')) {
        console.log('\n⚠️  错误来自Element Plus库');
        console.log('建议检查:');
        console.log('1. Element Plus版本是否与Vue 3兼容');
        console.log('2. 是否正确导入和注册Element Plus');
      }
    }
    
    // 尝试获取更多上下文
    const context = await page.evaluate(() => {
      // 检查Vue和Element Plus版本
      const getVersion = (obj) => {
        try {
          return obj.version || obj.VERSION || 'unknown';
        } catch {
          return 'error';
        }
      };
      
      return {
        vueVersion: typeof Vue !== 'undefined' ? getVersion(Vue) : 'not loaded',
        elementPlusVersion: typeof ElementPlus !== 'undefined' ? getVersion(ElementPlus) : 'not loaded',
        // 检查main.js是否执行
        appMounted: !!document.querySelector('#app')?.__vue_app__
      };
    });
    
    console.log('\n📦 依赖版本:');
    console.log('- Vue:', context.vueVersion);
    console.log('- Element Plus:', context.elementPlusVersion);
    console.log('- App挂载:', context.appMounted);
    
  } catch (error) {
    console.error('❌ 追踪脚本错误:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n💡 建议解决方案:');
  console.log('1. 检查package.json中的依赖版本');
  console.log('2. 清理node_modules并重新安装');
  console.log('3. 检查vite.config.js的构建配置');
  console.log('4. 尝试更新或降级Element Plus版本');
}

traceError();