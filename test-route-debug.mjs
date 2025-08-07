import { chromium } from 'playwright';

const TEST_URL = 'https://ai-pm-user-frontend.vercel.app';

async function debugRouting() {
  console.log('🔍 路由调试测试');
  console.log('================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有导航事件
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      console.log(`📍 导航到: ${frame.url()}`);
    }
  });

  // 监听控制台
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ 错误: ${msg.text()}`);
    }
  });

  try {
    // 测试1: 直接访问注册页面
    console.log('📋 测试1: 直接访问 /register');
    await page.goto(`${TEST_URL}/register`, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    await page.waitForTimeout(2000);
    
    let currentUrl = page.url();
    console.log(`   结果URL: ${currentUrl}`);
    
    if (currentUrl.includes('login')) {
      console.log('   ❌ 被重定向到登录页面');
    } else if (currentUrl.includes('register')) {
      console.log('   ✅ 成功进入注册页面');
    }

    // 检查页面内容
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent,
          href: a.href
        }))
      };
    });
    
    console.log('\n📄 页面内容:');
    console.log(`   标题: ${pageContent.title}`);
    console.log(`   H1: ${pageContent.h1}`);
    console.log(`   按钮:`, pageContent.buttons);
    console.log(`   链接:`, pageContent.links);

    // 测试2: 从登录页点击注册链接
    console.log('\n📋 测试2: 从登录页点击注册链接');
    
    // 查找注册链接
    const registerLinks = await page.locator('a').all();
    let registerLink = null;
    
    for (const link of registerLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && (text.includes('注册') || text.includes('立即注册'))) {
        console.log(`   找到链接: "${text}" -> ${href}`);
        registerLink = link;
        break;
      }
    }
    
    if (registerLink) {
      await registerLink.click();
      await page.waitForTimeout(2000);
      currentUrl = page.url();
      console.log(`   点击后URL: ${currentUrl}`);
      
      // 再次检查页面内容
      const hasEmailInput = await page.locator('input[type="email"], input[placeholder*="邮箱"]').count() > 0;
      const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
      const hasRegisterButton = await page.locator('button:has-text("注册")').count() > 0;
      
      console.log('\n📝 表单元素检查:');
      console.log(`   邮箱输入框: ${hasEmailInput ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   密码输入框: ${hasPasswordInput ? '✅ 存在' : '❌ 不存在'}`);  
      console.log(`   注册按钮: ${hasRegisterButton ? '✅ 存在' : '❌ 不存在'}`);
    } else {
      console.log('   ❌ 未找到注册链接');
    }

    // 测试3: 检查路由配置
    console.log('\n📋 测试3: 检查Vue Router配置');
    
    const routerInfo = await page.evaluate(() => {
      // 检查是否有Vue Router
      if (window.$router) {
        const routes = window.$router.getRoutes();
        return {
          hasRouter: true,
          currentRoute: window.$router.currentRoute.value.path,
          routes: routes.map(r => ({
            path: r.path,
            name: r.name,
            meta: r.meta
          }))
        };
      }
      return { hasRouter: false };
    });
    
    if (routerInfo.hasRouter) {
      console.log(`   当前路由: ${routerInfo.currentRoute}`);
      console.log(`   可用路由:`);
      routerInfo.routes.forEach(r => {
        console.log(`     - ${r.path} (${r.name || '未命名'})`);
      });
    } else {
      console.log('   ⚠️ 无法访问Vue Router实例');
    }

    // 测试4: 尝试使用不同的URL格式
    console.log('\n📋 测试4: 尝试不同的URL格式');
    
    const urlVariants = [
      '/register',
      '/#/register',
      '#/register',
      '/auth/register',
      '/#/auth/register'
    ];
    
    for (const variant of urlVariants) {
      console.log(`   尝试: ${TEST_URL}${variant}`);
      await page.goto(`${TEST_URL}${variant}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      }).catch(() => {});
      await page.waitForTimeout(1000);
      
      const url = page.url();
      const hasRegisterForm = await page.locator('input[placeholder*="邮箱"]').count() > 0;
      
      if (url.includes('register') && hasRegisterForm) {
        console.log(`     ✅ 成功！URL: ${url}`);
        break;
      } else {
        console.log(`     ❌ 失败，最终URL: ${url}`);
      }
    }

    // 测试5: 检查localStorage和sessionStorage
    console.log('\n📋 测试5: 检查存储');
    
    const storage = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });
    
    console.log('   localStorage:', storage.localStorage);
    console.log('   sessionStorage:', storage.sessionStorage);

    // 保持浏览器打开
    console.log('\n⏸️ 保持浏览器打开10秒...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 测试错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 调试完成');
  }
}

debugRouting().catch(console.error);