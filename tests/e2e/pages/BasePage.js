class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(path = '') {
    await this.page.goto(path);
  }

  async waitForLoadComplete() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async getTitle() {
    return await this.page.title();
  }

  async waitForElement(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout: 30000,
      ...options
    });
  }

  async click(selector) {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  async fill(selector, value) {
    await this.waitForElement(selector);
    await this.page.fill(selector, value);
  }

  async getText(selector) {
    await this.waitForElement(selector);
    return await this.page.textContent(selector);
  }

  async isVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  async waitForNavigation(url) {
    await this.page.waitForURL(url, { timeout: 30000 });
  }

  async getErrorMessage() {
    // Element Plus的错误消息选择器
    const errorSelectors = [
      '.el-message--error',
      '.el-form-item__error',
      '.el-alert--error'
    ];
    
    for (const selector of errorSelectors) {
      if (await this.isVisible(selector)) {
        return await this.getText(selector);
      }
    }
    return null;
  }

  async getSuccessMessage() {
    // Element Plus的成功消息选择器
    const successSelectors = [
      '.el-message--success',
      '.el-alert--success'
    ];
    
    for (const selector of successSelectors) {
      if (await this.isVisible(selector)) {
        return await this.getText(selector);
      }
    }
    return null;
  }
}

export default BasePage;