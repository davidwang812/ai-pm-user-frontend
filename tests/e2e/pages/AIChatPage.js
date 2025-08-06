import BasePage from './BasePage.js';

class AIChatPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      // 聊天界面
      chatContainer: '.chat-container, .chat-workspace',
      messageInput: 'textarea[placeholder*="输入"], input[placeholder*="消息"]',
      sendButton: 'button:has-text("发送"), button[type="submit"]',
      clearButton: 'button:has-text("清空"), button:has-text("新对话")',
      
      // 消息列表
      messageList: '.message-list, .chat-messages',
      userMessage: '.message-user, .user-message',
      aiMessage: '.message-ai, .ai-message',
      loadingIndicator: '.typing-indicator, .el-loading-mask',
      
      // AI类型选择
      aiTypeSelector: '.ai-type-select, select[name="ai-type"]',
      aiTypeOption: '.ai-type-option',
      currentAIType: '.current-ai-type',
      
      // PRD模式
      prdModeButton: 'button:has-text("PRD"), button:has-text("需求文档")',
      prdForm: '.prd-form',
      prdNameInput: 'input[placeholder*="产品名称"]',
      prdDescInput: 'textarea[placeholder*="产品描述"]',
      prdTargetInput: 'input[placeholder*="目标用户"]',
      prdFeaturesInput: 'textarea[placeholder*="核心功能"]',
      generatePRDButton: 'button:has-text("生成PRD")',
      prdContent: '.prd-content, .prd-result',
      prdPreviewButton: 'button:has-text("预览")',
      prdPreviewModal: '.prd-preview-modal',
      
      // Token显示
      tokenUsage: '.token-usage, .token-count',
      tokenRemaining: '.token-remaining',
      
      // 历史对话
      historyButton: 'button:has-text("历史"), button:has-text("记录")',
      historyPanel: '.history-panel, .chat-history',
      historyItem: '.history-item',
      deleteHistoryButton: '.delete-history',
      confirmDeleteButton: 'button:has-text("确认删除")',
      
      // 错误提示
      inputError: '.el-form-item__error',
      errorToast: '.el-message--error',
      networkError: '.network-error'
    };
  }

  async navigate() {
    await super.navigate('/#/chat');
    await this.waitForLoadComplete();
  }

  async waitForChatInterface() {
    await this.waitForElement(this.selectors.chatContainer);
    await this.waitForElement(this.selectors.messageInput);
  }

  async sendMessage(message) {
    await this.fill(this.selectors.messageInput, message);
    await this.click(this.selectors.sendButton);
  }

  async clickSendButton() {
    await this.click(this.selectors.sendButton);
  }

  async waitForAIResponse() {
    // 等待加载指示器出现
    await this.page.waitForSelector(this.selectors.loadingIndicator, {
      state: 'visible',
      timeout: 5000
    }).catch(() => {}); // 可能很快就完成了
    
    // 等待加载指示器消失
    await this.page.waitForSelector(this.selectors.loadingIndicator, {
      state: 'hidden',
      timeout: 30000
    });
    
    // 等待AI消息出现
    await this.waitForElement(this.selectors.aiMessage);
  }

  async getLastUserMessage() {
    const messages = await this.page.locator(this.selectors.userMessage).all();
    if (messages.length > 0) {
      return await messages[messages.length - 1].textContent();
    }
    return null;
  }

  async getLastAIMessage() {
    const messages = await this.page.locator(this.selectors.aiMessage).all();
    if (messages.length > 0) {
      return await messages[messages.length - 1].textContent();
    }
    return null;
  }

  async getMessageCount() {
    const userMessages = await this.page.locator(this.selectors.userMessage).count();
    const aiMessages = await this.page.locator(this.selectors.aiMessage).count();
    return userMessages + aiMessages;
  }

  async clearChat() {
    await this.click(this.selectors.clearButton);
    await this.page.waitForTimeout(500);
  }

  async getTokenUsage() {
    const tokenText = await this.getText(this.selectors.tokenUsage);
    const match = tokenText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async getAvailableAITypes() {
    await this.click(this.selectors.aiTypeSelector);
    await this.page.waitForTimeout(500);
    
    const options = await this.page.locator(this.selectors.aiTypeOption).allTextContents();
    
    // 关闭下拉菜单
    await this.page.keyboard.press('Escape');
    
    return options;
  }

  async switchAIType(typeName) {
    await this.click(this.selectors.aiTypeSelector);
    await this.page.waitForTimeout(500);
    
    await this.page.locator(this.selectors.aiTypeOption)
      .filter({ hasText: typeName })
      .click();
  }

  async getCurrentAIType() {
    return await this.getText(this.selectors.currentAIType);
  }

  async switchToPRDMode() {
    await this.click(this.selectors.prdModeButton);
    await this.waitForElement(this.selectors.prdForm);
  }

  async fillPRDForm(productInfo) {
    await this.fill(this.selectors.prdNameInput, productInfo.name);
    await this.fill(this.selectors.prdDescInput, productInfo.description);
    await this.fill(this.selectors.prdTargetInput, productInfo.targetUsers);
    
    if (productInfo.coreFeatures) {
      const featuresText = productInfo.coreFeatures.join('\n');
      await this.fill(this.selectors.prdFeaturesInput, featuresText);
    }
  }

  async generatePRD() {
    await this.click(this.selectors.generatePRDButton);
  }

  async waitForPRDGeneration() {
    // 等待生成完成
    await this.page.waitForSelector(this.selectors.loadingIndicator, {
      state: 'hidden',
      timeout: 60000
    });
    
    await this.waitForElement(this.selectors.prdContent);
  }

  async getPRDContent() {
    return await this.getText(this.selectors.prdContent);
  }

  async previewPRD() {
    await this.click(this.selectors.prdPreviewButton);
  }

  async isPRDPreviewVisible() {
    return await this.isVisible(this.selectors.prdPreviewModal);
  }

  async getInputError() {
    return await this.getText(this.selectors.inputError);
  }

  async getErrorMessage() {
    const selectors = [
      this.selectors.errorToast,
      this.selectors.networkError,
      '.error-message'
    ];
    
    for (const selector of selectors) {
      if (await this.isVisible(selector)) {
        return await this.getText(selector);
      }
    }
    return null;
  }

  async openChatHistory() {
    await this.click(this.selectors.historyButton);
    await this.waitForElement(this.selectors.historyPanel);
  }

  async getHistoryCount() {
    return await this.page.locator(this.selectors.historyItem).count();
  }

  async selectHistoryChat(index) {
    const items = await this.page.locator(this.selectors.historyItem).all();
    if (items[index]) {
      await items[index].click();
      await this.page.waitForTimeout(1000);
    }
  }

  async deleteHistoryChat(index) {
    const items = await this.page.locator(this.selectors.historyItem).all();
    if (items[index]) {
      await items[index].hover();
      await items[index].locator(this.selectors.deleteHistoryButton).click();
    }
  }

  async confirmDelete() {
    await this.click(this.selectors.confirmDeleteButton);
    await this.page.waitForTimeout(500);
  }
}

export default AIChatPage;