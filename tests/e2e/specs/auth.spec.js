import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import RegisterPage from '../pages/RegisterPage.js';
import HomePage from '../pages/HomePage.js';

test.describe('用户认证测试', () => {
  let loginPage;
  let registerPage;
  let homePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    homePage = new HomePage(page);
  });

  test.describe('登录功能', () => {
    test('成功登录有效用户', async ({ page }) => {
      // 导航到登录页面
      await loginPage.navigate();
      await loginPage.waitForLoginForm();
      
      // 执行登录
      await loginPage.login('test@example.com', 'Test123456!');
      
      // 验证登录成功
      const isSuccess = await loginPage.isLoginSuccessful();
      expect(isSuccess).toBeTruthy();
      
      // 验证跳转到首页
      await homePage.waitForHomePageLoad();
      const isLoggedIn = await homePage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    });

    test('无效凭据登录失败', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.waitForLoginForm();
      
      // 使用错误的密码登录
      await loginPage.login('test@example.com', 'wrongpassword');
      
      // 验证显示错误消息
      const errorMessage = await loginPage.getLoginError();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toMatch(/用户名或密码错误|登录失败/i);
      
      // 验证仍在登录页面
      const stillOnLogin = await loginPage.isOnLoginPage();
      expect(stillOnLogin).toBeTruthy();
    });

    test('空字段验证', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.waitForLoginForm();
      
      // 直接点击登录按钮
      await loginPage.clickLogin();
      
      // 验证显示必填字段错误
      await page.waitForTimeout(1000);
      
      // 检查是否有表单验证错误
      const hasError = await page.locator('.el-form-item__error').count() > 0;
      expect(hasError).toBeTruthy();
    });

    test('邮箱格式验证', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.waitForLoginForm();
      
      // 输入无效邮箱格式
      await loginPage.fillEmail('notanemail');
      await loginPage.fillPassword('Test123456!');
      await loginPage.clickLogin();
      
      // 等待验证
      await page.waitForTimeout(1000);
      
      // 检查邮箱格式错误
      const emailError = await page.locator('input[type="email"]')
        .locator('xpath=../..')
        .locator('.el-form-item__error')
        .textContent();
      
      expect(emailError).toMatch(/邮箱|email/i);
    });
  });

  test.describe('注册功能', () => {
    test('成功注册新用户', async ({ page }) => {
      await registerPage.navigate();
      await registerPage.waitForRegistrationForm();
      
      // 生成唯一的测试数据
      const timestamp = Date.now();
      const testEmail = `test_${timestamp}@example.com`;
      const testUsername = `testuser_${timestamp}`;
      
      // 填写注册表单
      await registerPage.register(
        testEmail,
        testUsername,
        'Test123456!',
        'Test123456!'
      );
      
      // 验证注册成功
      const isSuccess = await registerPage.isRegistrationSuccessful();
      expect(isSuccess).toBeTruthy();
    });

    test('密码不匹配验证', async ({ page }) => {
      await registerPage.navigate();
      await registerPage.waitForRegistrationForm();
      
      // 填写不匹配的密码
      await registerPage.fillRegistrationForm({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123456!',
        confirmPassword: 'Different123!'
      });
      
      await registerPage.clickRegister();
      
      // 等待验证
      await page.waitForTimeout(1000);
      
      // 检查密码不匹配错误
      const error = await registerPage.getFieldError('confirmPassword');
      expect(error).toMatch(/密码不一致|不匹配/i);
    });

    test('邮箱已存在验证', async ({ page }) => {
      await registerPage.navigate();
      await registerPage.waitForRegistrationForm();
      
      // 使用已存在的邮箱注册
      await registerPage.register(
        'test@example.com',
        'newuser',
        'Test123456!',
        'Test123456!'
      );
      
      // 验证显示错误
      const error = await registerPage.getRegistrationError();
      expect(error).toBeTruthy();
      expect(error).toMatch(/已存在|已注册/i);
    });

    test('密码强度验证', async ({ page }) => {
      await registerPage.navigate();
      await registerPage.waitForRegistrationForm();
      
      // 输入弱密码
      await registerPage.fillRegistrationForm({
        email: 'weak@example.com',
        username: 'weakuser',
        password: '123',
        confirmPassword: '123'
      });
      
      await registerPage.clickRegister();
      await page.waitForTimeout(1000);
      
      // 检查密码强度错误
      const error = await registerPage.getFieldError('password');
      expect(error).toBeTruthy();
      expect(error).toMatch(/密码.*至少.*8|密码太短/i);
    });
  });

  test.describe('登出功能', () => {
    test('成功登出', async ({ page }) => {
      // 先登录
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      await loginPage.isLoginSuccessful();
      
      // 等待首页加载
      await homePage.waitForHomePageLoad();
      
      // 执行登出
      await homePage.logout();
      
      // 验证返回登录页
      await page.waitForURL(/login/i);
      const isOnLogin = await loginPage.isOnLoginPage();
      expect(isOnLogin).toBeTruthy();
    });
  });
});