// 无头模式获取控制台错误

import { chromium } from '@playwright/test';
import fs from 'fs';

async function getConsoleErrorsHeadless() {
  console.log('🔍 获取浏览器控制台错误（无头模式）...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    const allLogs = [];
    
    // 捕获控制台消息
    page.on('console', async msg => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      
      allLogs.push(entry);
      
      // 只输出警告和错误
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const icon = msg.type() === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${msg.type().toUpperCase()}] ${msg.text()}`);
        
        if (msg.location().url) {
          const loc = msg.location();
          console.log(`   位置: ${loc.url}:${loc.lineNumber}:${loc.columnNumber}`);
        }
      }
    });
    
    // 捕获页面错误
    page.on('pageerror', error => {
      console.error('\n🚨 页面JavaScript错误:');
      console.error('消息:', error.message);
      console.error('堆栈:', error.stack || '无堆栈信息');
      console.error('');
    });
    
    // 捕获请求失败
    page.on('requestfailed', request => {
      if (request.url().includes('.js')) {
        console.error(`❌ JS文件加载失败: ${request.url()}`);
        console.error(`   原因: ${request.failure()?.errorText}`);
      }
    });
    
    console.log('📍 访问: https://ai-pm-user-frontend.vercel.app');
    console.log('⏳ 等待错误信息...\n');
    
    await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });
    
    // 等待可能的延迟错误
    await page.waitForTimeout(5000);
    
    // 执行诊断
    const diagnosis = await page.evaluate(() => {
      // 尝试找出具体的错误
      const getErrorDetails = () => {
        try {
          // 检查是否有任何全局错误
          if (window.__errorDetails) {
            return window.__errorDetails;
          }
          
          // 检查Vue应用
          const app = document.querySelector('#app');
          if (!app) return { error: 'No #app element found' };
          
          if (app.innerHTML.trim() === '') {
            return { 
              error: 'App is empty',
              vueApp: !!app.__vue_app__,
              childNodes: app.childNodes.length
            };
          }
          
          return { success: true, content: app.innerHTML.substring(0, 100) };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      };
      
      return {
        url: window.location.href,
        title: document.title,
        readyState: document.readyState,
        errorDetails: getErrorDetails(),
        scripts: Array.from(document.scripts).map(s => ({
          src: s.src || 'inline',
          async: s.async,
          defer: s.defer,
          type: s.type || 'text/javascript'
        }))
      };
    });
    
    console.log('\n📋 页面诊断结果:');
    console.log(JSON.stringify(diagnosis, null, 2));
    
    // 统计错误
    const errors = allLogs.filter(log => log.type === 'error');
    const warnings = allLogs.filter(log => log.type === 'warning');
    
    console.log('\n📊 控制台消息统计:');
    console.log(`- 错误数: ${errors.length}`);
    console.log(`- 警告数: ${warnings.length}`);
    console.log(`- 总消息数: ${allLogs.length}`);
    
    if (errors.length === 0) {
      console.log('\n⚠️  没有捕获到明显的控制台错误');
      console.log('可能的原因：');
      console.log('1. 错误发生在控制台初始化之前');
      console.log('2. 错误被静默处理');
      console.log('3. 构建时的错误未在运行时显示');
    }
    
    // 保存所有日志
    fs.writeFileSync('test-results/all-console-logs.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      url: 'https://ai-pm-user-frontend.vercel.app',
      diagnosis,
      logs: allLogs
    }, null, 2));
    
    console.log('\n💾 完整日志已保存到: test-results/all-console-logs.json');
    
  } catch (error) {
    console.error('❌ 执行错误:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 完成！');
}

getConsoleErrorsHeadless();