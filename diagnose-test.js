// 诊断测试脚本 - 分析页面结构

import { chromium } from '@playwright/test';

async function diagnoseTest() {
  console.log('🔍 诊断测试开始...\n');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // 访问网站
    console.log('📍 访问网站...');
    const response = await page.goto('https://ai-pm-user-frontend.vercel.app', {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log(`响应状态: ${response.status()}`);
    console.log(`页面URL: ${page.url()}`);
    console.log(`页面标题: ${await page.title()}`);
    
    // 等待页面加载
    await page.waitForTimeout(5000);
    
    // 获取页面内容摘要
    console.log('\n📄 页面内容分析:');
    
    // 检查是否有错误
    const errorText = await page.locator('.error, .el-alert--error').allTextContents();
    if (errorText.length > 0) {
      console.log('❌ 发现错误信息:', errorText);
    }
    
    // 获取所有可见文本
    const visibleText = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, button, a');
      return Array.from(elements)
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0)
        .slice(0, 20); // 只取前20个
    });
    
    console.log('\n可见文本元素:');
    visibleText.forEach((text, i) => {
      console.log(`  ${i + 1}. ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    });
    
    // 查找所有链接
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.textContent.trim(), href: a.href }))
        .filter(link => link.text);
    });
    
    console.log('\n🔗 找到的链接:');
    links.forEach(link => {
      console.log(`  - "${link.text}" -> ${link.href}`);
    });
    
    // 查找所有按钮
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, .el-button, [type="button"]'))
        .map(btn => btn.textContent.trim())
        .filter(text => text);
    });
    
    console.log('\n🔘 找到的按钮:');
    buttons.forEach(btn => {
      console.log(`  - ${btn}`);
    });
    
    // 查找表单
    const forms = await page.locator('form').count();
    console.log(`\n📝 表单数量: ${forms}`);
    
    // 查找输入框
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input'))
        .map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          id: input.id
        }));
    });
    
    if (inputs.length > 0) {
      console.log('\n📥 输入框:');
      inputs.forEach(input => {
        console.log(`  - Type: ${input.type}, Placeholder: ${input.placeholder || '无'}`);
      });
    }
    
    // 保存页面HTML
    const html = await page.content();
    console.log(`\n📏 页面大小: ${html.length} 字符`);
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/diagnose.png',
      fullPage: true 
    });
    console.log('📸 截图已保存: test-results/screenshots/diagnose.png');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✨ 诊断完成!');
}

diagnoseTest();