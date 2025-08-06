import BasePage from './BasePage.js';

class RegisterPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      emailInput: 'input[type="email"], input[placeholder*="邮箱"]',
      usernameInput: 'input[placeholder*="用户名"]',
      passwordInput: 'input[type="password"]:not([placeholder*="确认"])',
      confirmPasswordInput: 'input[type="password"][placeholder*="确认"]',
      agreeCheckbox: 'input[type="checkbox"]',
      registerButton: 'button[type="submit"], button:has-text("注册")',
      loginLink: 'a:has-text("登录"), button:has-text("登录")',
      errorMessage: '.el-message--error, .el-form-item__error',
      successMessage: '.el-message--success'
    };
  }

  async navigate() {
    await super.navigate('/#/register');
    await this.waitForLoadComplete();
  }

  async register(email, username, password, confirmPassword = null) {
    await this.fill(this.selectors.emailInput, email);
    await this.fill(this.selectors.usernameInput, username);
    await this.fill(this.selectors.passwordInput, password);
    
    if (confirmPassword) {
      await this.fill(this.selectors.confirmPasswordInput, confirmPassword);
    } else {
      // 如果没有提供确认密码，使用相同的密码
      await this.fill(this.selectors.confirmPasswordInput, password);
    }
    
    // 勾选同意条款（如果存在）
    const hasAgreement = await this.page.locator(this.selectors.agreeCheckbox).count() > 0;
    if (hasAgreement) {
      await this.click(this.selectors.agreeCheckbox);
    }
    
    await this.click(this.selectors.registerButton);
    await this.page.waitForTimeout(2000); // 等待注册处理
  }

  async fillRegistrationForm(data) {
    if (data.email) await this.fill(this.selectors.emailInput, data.email);
    if (data.username) await this.fill(this.selectors.usernameInput, data.username);
    if (data.password) await this.fill(this.selectors.passwordInput, data.password);
    if (data.confirmPassword) {
      await this.fill(this.selectors.confirmPasswordInput, data.confirmPassword);
    }
  }

  async clickRegister() {
    await this.click(this.selectors.registerButton);
  }

  async clickLogin() {
    await this.click(this.selectors.loginLink);
  }

  async agreeToTerms() {
    await this.click(this.selectors.agreeCheckbox);
  }

  async isRegistrationSuccessful() {
    // 检查是否有成功消息
    const hasSuccessMessage = await this.isVisible(this.selectors.successMessage);
    if (hasSuccessMessage) {
      return true;
    }
    
    // 或者检查是否跳转到登录页
    try {
      await this.page.waitForURL(/login/i, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async getRegistrationError() {
    return await this.getErrorMessage();
  }

  async getFieldError(field) {
    // 获取特定字段的错误信息
    const fieldSelectors = {
      email: this.selectors.emailInput,
      username: this.selectors.usernameInput,
      password: this.selectors.passwordInput,
      confirmPassword: this.selectors.confirmPasswordInput
    };
    
    const fieldSelector = fieldSelectors[field];
    if (!fieldSelector) return null;
    
    // Element Plus的表单验证错误通常在输入框的父元素中
    const errorElement = await this.page.locator(fieldSelector)
      .locator('xpath=../..')
      .locator('.el-form-item__error');
    
    if (await errorElement.count() > 0) {
      return await errorElement.textContent();
    }
    
    return null;
  }

  async waitForRegistrationForm() {
    await this.waitForElement(this.selectors.emailInput);
    await this.waitForElement(this.selectors.usernameInput);
    await this.waitForElement(this.selectors.passwordInput);
    await this.waitForElement(this.selectors.registerButton);
  }
}

export default RegisterPage;