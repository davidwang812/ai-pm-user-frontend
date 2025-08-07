import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';

async function testHomepageAccess() {
  console.log('🏠 测试首页访问（不应强制登录）');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();
  
  // 监听重定向
  const navigationLog = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigationLog.push(frame.url());
    }
  });

  try {
    console.log(`📍 访问首页: ${TEST_URL}`);
    
    // 访问首页
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    const finalUrl = page.url();
    const status = response.status();
    
    console.log(`   HTTP状态: ${status}`);
    console.log(`   最终URL: ${finalUrl}\n`);
    
    // 检查导航历史
    if (navigationLog.length > 1) {
      console.log('🔄 页面跳转历史:');
      navigationLog.forEach((url, i) => {
        console.log(`   ${i + 1}. ${url}`);
      });
      console.log('');
    }
    
    // 分析结果
    if (finalUrl.includes('/login')) {
      console.log('❌ 测试失败: 首页被强制跳转到登录页面');
      console.log('   问题: 用户无法查看首页内容');
    } else if (finalUrl === TEST_URL || finalUrl === TEST_URL + '/') {
      console.log('✅ 测试通过: 首页可以正常访问');
      
      // 检查页面内容
      const pageTitle = await page.title();
      console.log(`   页面标题: ${pageTitle}`);
      
      // 检查是否有Landing页面的特征元素
      const hasHeroSection = await page.locator('.hero').count() > 0;
      const hasFeatures = await page.locator('.features').count() > 0;
      const hasPricing = await page.locator('.pricing').count() > 0;
      const hasLoginButton = await page.locator('a[href="/login"]').count() > 0;
      const hasRegisterButton = await page.locator('a[href="/register"]').count() > 0;
      
      console.log('\n📋 页面内容检查:');
      console.log(`   Hero区域: ${hasHeroSection ? '✅' : '❌'}`);
      console.log(`   功能介绍: ${hasFeatures ? '✅' : '❌'}`);
      console.log(`   价格方案: ${hasPricing ? '✅' : '❌'}`);
      console.log(`   登录按钮: ${hasLoginButton ? '✅' : '❌'}`);
      console.log(`   注册按钮: ${hasRegisterButton ? '✅' : '❌'}`);
      
      // 检查主要文本
      const heroText = await page.locator('.hero-title').textContent().catch(() => '');
      if (heroText) {
        console.log(`\n   主标题: "${heroText}"`);
      }
      
      // 总体评估
      const checksPassed = [hasHeroSection, hasFeatures, hasPricing, hasLoginButton, hasRegisterButton].filter(Boolean).length;
      
      console.log(`\n🎯 Landing页面完整性: ${checksPassed}/5`);
      
      if (checksPassed >= 4) {
        console.log('   🎉 优秀！Landing页面正常显示');
      } else if (checksPassed >= 3) {
        console.log('   ✅ 良好，Landing页面基本正常');
      } else {
        console.log('   ⚠️ Landing页面可能存在问题');
      }
      
    } else if (finalUrl.includes('/dashboard')) {
      console.log('⚠️ 测试异常: 未登录却进入了Dashboard');
      console.log('   可能原因: 存在有效的登录凭证');
    }
    
    // 测试导航链接
    console.log('\n🔗 测试导航链接:');
    
    // 点击登录链接
    const loginLink = await page.locator('a[href="/login"]').first();
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      const loginUrl = page.url();
      console.log(`   登录链接: ${loginUrl.includes('/login') ? '✅ 正常跳转' : '❌ 跳转失败'}`);
      
      // 返回首页
      await page.goBack();
    }
    
    // 点击注册链接
    const registerLink = await page.locator('a[href="/register"]').first();
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      const registerUrl = page.url();
      console.log(`   注册链接: ${registerUrl.includes('/register') ? '✅ 正常跳转' : '❌ 跳转失败'}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成');
  }
}

// 运行测试
testHomepageAccess().catch(console.error);