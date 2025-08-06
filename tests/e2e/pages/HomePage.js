import BasePage from './BasePage.js';

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      // 导航相关
      userAvatar: '.user-avatar, .el-avatar',
      userDropdown: '.user-dropdown, .el-dropdown',
      logoutButton: 'button:has-text("退出"), a:has-text("退出登录")',
      
      // 主要功能按钮
      newChatButton: 'button:has-text("新建对话"), button:has-text("开始对话")',
      productListButton: 'a:has-text("产品列表"), button:has-text("我的产品")',
      
      // Token显示
      tokenDisplay: '.token-display, .token-info',
      tokenCount: '.token-count, .token-remaining',
      
      // 功能卡片
      aiChatCard: '.feature-card:has-text("AI对话")',
      productManageCard: '.feature-card:has-text("产品管理")',
      exportCard: '.feature-card:has-text("导出")',
      
      // 统计信息
      totalProducts: '.stat-item:has-text("产品") .stat-value',
      todayTokens: '.stat-item:has-text("今日") .stat-value',
      
      // 欢迎信息
      welcomeMessage: '.welcome-message, h1',
      userName: '.user-name, .username'
    };
  }

  async navigate() {
    await super.navigate('/#/home');
    await this.waitForLoadComplete();
  }

  async waitForHomePageLoad() {
    // 等待关键元素加载
    await this.waitForElement(this.selectors.userAvatar);
    await this.page.waitForTimeout(1000); // 等待数据加载
  }

  async logout() {
    // 点击用户头像打开下拉菜单
    await this.click(this.selectors.userAvatar);
    await this.page.waitForTimeout(500);
    
    // 点击退出按钮
    await this.click(this.selectors.logoutButton);
    await this.page.waitForTimeout(1000);
  }

  async startNewChat() {
    await this.click(this.selectors.newChatButton);
  }

  async goToProductList() {
    await this.click(this.selectors.productListButton);
  }

  async getTokenCount() {
    const tokenText = await this.getText(this.selectors.tokenCount);
    // 提取数字
    const match = tokenText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async getUserName() {
    try {
      return await this.getText(this.selectors.userName);
    } catch {
      return null;
    }
  }

  async getTotalProducts() {
    try {
      const text = await this.getText(this.selectors.totalProducts);
      return parseInt(text) || 0;
    } catch {
      return 0;
    }
  }

  async getTodayTokenUsage() {
    try {
      const text = await this.getText(this.selectors.todayTokens);
      return parseInt(text) || 0;
    } catch {
      return 0;
    }
  }

  async clickFeatureCard(featureName) {
    const cardSelectors = {
      'ai': this.selectors.aiChatCard,
      'product': this.selectors.productManageCard,
      'export': this.selectors.exportCard
    };
    
    const selector = cardSelectors[featureName.toLowerCase()];
    if (selector) {
      await this.click(selector);
    }
  }

  async isLoggedIn() {
    // 检查是否显示用户头像
    return await this.isVisible(this.selectors.userAvatar);
  }

  async hasWelcomeMessage() {
    return await this.isVisible(this.selectors.welcomeMessage);
  }
}

export default HomePage;