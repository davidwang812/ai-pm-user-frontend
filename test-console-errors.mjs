import { chromium } from 'playwright';

async function testConsoleErrors() {
  console.log('🔍 测试Vue 3用户端前端...');
  console.log('URL: https://ai-pm-user-frontend.vercel.app/\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  // 捕获控制台错误
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // 捕获控制台日志
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(`Console warning: ${msg.text()}`);
    }
  });

  try {
    // 访问页面
    await page.goto('https://ai-pm-user-frontend.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 检查页面是否有内容
    const hasContent = await page.locator('body').evaluate(el => {
      return el.innerText.trim().length > 0;
    });
    
    // 检查是否有Vue应用挂载
    const hasVueApp = await page.evaluate(() => {
      return document.querySelector('#app') !== null;
    });
    
    // 获取页面标题
    const title = await page.title();
    
    console.log('📊 测试结果:');
    console.log('==============');
    console.log(`✅ 页面标题: ${title}`);
    console.log(`✅ 页面内容: ${hasContent ? '有内容' : '空白页面'}`);
    console.log(`✅ Vue应用: ${hasVueApp ? '已挂载' : '未找到'}`);
    
    if (errors.length > 0) {
      console.log('\n❌ 发现错误:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ 没有控制台错误');
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  警告信息:');
      warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
    }
    
    // 检查是否包含"Cannot access 'aa' before initialization"错误
    const hasRefImplError = errors.some(err => 
      err.includes("Cannot access") && err.includes("before initialization")
    );
    
    if (hasRefImplError) {
      console.log('\n⚠️  仍然存在Vue RefImpl初始化错误，需要进一步优化');
    } else if (errors.length === 0 && hasContent && hasVueApp) {
      console.log('\n🎉 部署成功！页面正常运行，无错误。');
    } else if (!hasContent) {
      console.log('\n⚠️  页面显示为空白，可能是路由或渲染问题');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  } finally {
    await browser.close();
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}

// 运行测试
testConsoleErrors().catch(console.error);