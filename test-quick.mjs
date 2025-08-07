// 快速测试 - 使用更宽松的选择器
import { chromium } from 'playwright';

async function quickTest() {
  console.log('🎭 快速测试...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://ai-pm-user-frontend.vercel.app/register');
    await page.waitForTimeout(3000);
    
    // 使用evaluate直接在页面中查找
    const formInfo = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      const allButtons = document.querySelectorAll('button');
      
      return {
        totalInputs: allInputs.length,
        inputTypes: Array.from(allInputs).map(i => ({
          type: i.type,
          placeholder: i.placeholder,
          name: i.name,
          id: i.id,
          className: i.className
        })),
        totalButtons: allButtons.length,
        buttonTexts: Array.from(allButtons).map(b => b.textContent.trim())
      };
    });
    
    console.log('📊 表单分析:');
    console.log(`  输入框总数: ${formInfo.totalInputs}`);
    console.log(`  按钮总数: ${formInfo.totalButtons}`);
    
    console.log('\n📝 输入框详情:');
    formInfo.inputTypes.forEach((input, i) => {
      console.log(`  Input #${i + 1}:`);
      console.log(`    type: ${input.type}`);
      console.log(`    placeholder: ${input.placeholder}`);
    });
    
    console.log('\n🔘 按钮详情:');
    formInfo.buttonTexts.forEach((text, i) => {
      console.log(`  Button #${i + 1}: "${text}"`);
    });
    
    // 尝试简单填写
    if (formInfo.totalInputs >= 4) {
      console.log('\n📍 尝试填写表单...');
      
      const timestamp = Date.now();
      
      // 按顺序填写所有input
      const inputs = await page.$$('input');
      
      if (inputs[0]) await inputs[0].fill(`test${timestamp}@example.com`);
      if (inputs[1]) await inputs[1].fill(`user${timestamp}`);
      if (inputs[2]) await inputs[2].fill('Test123456!');
      if (inputs[3]) await inputs[3].fill('Test123456!');
      
      console.log('✅ 表单填写完成');
      
      // 查找并点击注册按钮
      const registerButton = await page.$('button.el-button--primary');
      if (registerButton) {
        console.log('\n📍 点击注册按钮...');
        
        // 监听响应
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/api/'),
          { timeout: 5000 }
        ).catch(() => null);
        
        await registerButton.click();
        
        const response = await responsePromise;
        if (response) {
          console.log(`📡 API响应: ${response.status()} ${response.url()}`);
          
          if (response.status() === 200 || response.status() === 201) {
            console.log('✅ 注册成功！');
          }
        } else {
          console.log('⚠️ 未捕获到API调用');
        }
      }
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  await browser.close();
  console.log('\n✅ 测试结束');
}

quickTest().catch(console.error);