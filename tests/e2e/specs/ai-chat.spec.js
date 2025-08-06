import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import HomePage from '../pages/HomePage.js';
import AIChatPage from '../pages/AIChatPage.js';

test.describe('AI对话功能测试', () => {
  let loginPage;
  let homePage;
  let aiChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    aiChatPage = new AIChatPage(page);
    
    // 登录到系统
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'Test123456!');
    await loginPage.isLoginSuccessful();
  });

  test.describe('基础对话功能', () => {
    test('发送简单消息并接收AI响应', async ({ page }) => {
      // 进入AI对话页面
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 发送消息
      const testMessage = '你好，请介绍一下自己';
      await aiChatPage.sendMessage(testMessage);
      
      // 验证消息发送
      const userMessage = await aiChatPage.getLastUserMessage();
      expect(userMessage).toBe(testMessage);
      
      // 等待AI响应
      await aiChatPage.waitForAIResponse();
      
      // 验证AI响应
      const aiResponse = await aiChatPage.getLastAIMessage();
      expect(aiResponse).toBeTruthy();
      expect(aiResponse.length).toBeGreaterThan(10);
      
      // 验证Token使用更新
      const tokenUsed = await aiChatPage.getTokenUsage();
      expect(tokenUsed).toBeGreaterThan(0);
    });

    test('多轮对话上下文保持', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 第一轮对话
      await aiChatPage.sendMessage('我叫小明');
      await aiChatPage.waitForAIResponse();
      
      // 第二轮对话 - 测试上下文
      await aiChatPage.sendMessage('我叫什么名字？');
      await aiChatPage.waitForAIResponse();
      
      // 验证AI记住了名字
      const response = await aiChatPage.getLastAIMessage();
      expect(response.toLowerCase()).toMatch(/小明|xiaomin/);
    });

    test('清空对话历史', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 发送几条消息
      await aiChatPage.sendMessage('测试消息1');
      await aiChatPage.waitForAIResponse();
      await aiChatPage.sendMessage('测试消息2');
      await aiChatPage.waitForAIResponse();
      
      // 清空对话
      await aiChatPage.clearChat();
      
      // 验证对话已清空
      const messageCount = await aiChatPage.getMessageCount();
      expect(messageCount).toBe(0);
    });
  });

  test.describe('AI类型切换', () => {
    test('切换不同的AI服务', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 获取可用的AI类型
      const aiTypes = await aiChatPage.getAvailableAITypes();
      expect(aiTypes.length).toBeGreaterThan(0);
      
      // 切换AI类型
      if (aiTypes.length > 1) {
        await aiChatPage.switchAIType(aiTypes[1]);
        
        // 验证切换成功
        const currentType = await aiChatPage.getCurrentAIType();
        expect(currentType).toBe(aiTypes[1]);
      }
    });
  });

  test.describe('PRD生成功能', () => {
    test('生成产品需求文档', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 切换到PRD模式
      await aiChatPage.switchToPRDMode();
      
      // 填写产品信息
      const productInfo = {
        name: '智能健身应用',
        description: '基于AI的个性化健身指导应用',
        targetUsers: '健身爱好者和初学者',
        coreFeatures: ['个性化训练计划', 'AI动作纠正', '营养建议']
      };
      
      await aiChatPage.fillPRDForm(productInfo);
      
      // 生成PRD
      await aiChatPage.generatePRD();
      
      // 等待生成完成
      await aiChatPage.waitForPRDGeneration();
      
      // 验证PRD生成
      const prdContent = await aiChatPage.getPRDContent();
      expect(prdContent).toContain(productInfo.name);
      expect(prdContent).toContain('产品概述');
      expect(prdContent).toContain('用户故事');
      
      // 验证可以预览
      await aiChatPage.previewPRD();
      const isPreviewVisible = await aiChatPage.isPRDPreviewVisible();
      expect(isPreviewVisible).toBeTruthy();
    });
  });

  test.describe('错误处理', () => {
    test('空消息验证', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 尝试发送空消息
      await aiChatPage.clickSendButton();
      
      // 验证错误提示
      const error = await aiChatPage.getInputError();
      expect(error).toMatch(/请输入消息|不能为空/);
    });

    test('Token不足提示', async ({ page }) => {
      // 这个测试需要特殊的测试账号（Token余额为0）
      // 或者mock API响应
      test.skip(true, '需要特殊测试环境');
    });

    test('网络错误处理', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 模拟网络断开
      await page.context().setOffline(true);
      
      // 尝试发送消息
      await aiChatPage.sendMessage('测试消息');
      
      // 验证错误提示
      const error = await aiChatPage.getErrorMessage();
      expect(error).toMatch(/网络|连接/);
      
      // 恢复网络
      await page.context().setOffline(false);
    });
  });

  test.describe('对话历史管理', () => {
    test('查看历史对话列表', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 打开历史对话
      await aiChatPage.openChatHistory();
      
      // 验证历史列表显示
      const historyCount = await aiChatPage.getHistoryCount();
      expect(historyCount).toBeGreaterThanOrEqual(0);
    });

    test('加载历史对话', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.openChatHistory();
      
      const historyCount = await aiChatPage.getHistoryCount();
      if (historyCount > 0) {
        // 选择第一个历史对话
        await aiChatPage.selectHistoryChat(0);
        
        // 验证对话加载
        const messageCount = await aiChatPage.getMessageCount();
        expect(messageCount).toBeGreaterThan(0);
      }
    });

    test('删除历史对话', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 先创建一个对话
      await aiChatPage.sendMessage('测试对话');
      await aiChatPage.waitForAIResponse();
      
      // 打开历史
      await aiChatPage.openChatHistory();
      const beforeCount = await aiChatPage.getHistoryCount();
      
      // 删除第一个对话
      await aiChatPage.deleteHistoryChat(0);
      
      // 确认删除
      await aiChatPage.confirmDelete();
      
      // 验证删除成功
      const afterCount = await aiChatPage.getHistoryCount();
      expect(afterCount).toBe(beforeCount - 1);
    });
  });
});