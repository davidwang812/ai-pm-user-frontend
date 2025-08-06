import BasePage from './BasePage.js';

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // 定义页面元素选择器
    this.selectors = {
      emailInput: 'input[type="email"], input[placeholder*="邮箱"]',
      passwordInput: 'input[type="password"]',
      loginButton: 'button[type="submit"], button:has-text("登录")',
      registerLink: 'a:has-text("注册"), button:has-text("注册")',
      forgotPasswordLink: 'a:has-text("忘记密码")',
      rememberCheckbox: 'input[type="checkbox"]',
      errorMessage: '.el-message--error, .el-form-item__error',
      loadingSpinner: '.el-loading-mask',
      pageTitle: 'h1, .login-title'
    };
  }

  async navigate() {
    await super.navigate('/#/login');
    await this.waitForLoadComplete();
  }

  async login(email, password) {
    await this.fill(this.selectors.emailInput, email);
    await this.fill(this.selectors.passwordInput, password);
    await this.click(this.selectors.loginButton);
    
    // 等待加载完成
    await this.page.waitForTimeout(1000);
    
    // 检查是否有loading状态
    const hasLoading = await this.page.locator(this.selectors.loadingSpinner).count() > 0;
    if (hasLoading) {
      await this.page.waitForSelector(this.selectors.loadingSpinner, { 
        state: 'hidden',
        timeout: 10000 
      });
    }
  }

  async fillEmail(email) {
    await this.fill(this.selectors.emailInput, email);
  }

  async fillPassword(password) {
    await this.fill(this.selectors.passwordInput, password);
  }

  async clickLogin() {
    await this.click(this.selectors.loginButton);
  }

  async clickRegister() {
    await this.click(this.selectors.registerLink);
  }

  async toggleRememberMe() {
    await this.click(this.selectors.rememberCheckbox);
  }

  async isLoginSuccessful() {
    try {
      // 登录成功后应该跳转到首页或dashboard
      await this.page.waitForURL(/(home|dashboard|#\/(?!login))/i, { 
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  async getLoginError() {
    return await this.getErrorMessage();
  }

  async isOnLoginPage() {
    const url = this.page.url();
    return url.includes('login');
  }

  async waitForLoginForm() {
    await this.waitForElement(this.selectors.emailInput);
    await this.waitForElement(this.selectors.passwordInput);
    await this.waitForElement(this.selectors.loginButton);
  }
}

export default LoginPage;