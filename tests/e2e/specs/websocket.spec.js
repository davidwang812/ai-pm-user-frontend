import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import AIChatPage from '../pages/AIChatPage.js';

test.describe('WebSocket实时通信测试', () => {
  let loginPage;
  let aiChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    aiChatPage = new AIChatPage(page);
    
    // 登录系统
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'Test123456!');
    await loginPage.isLoginSuccessful();
  });

  test.describe('WebSocket连接', () => {
    test('建立WebSocket连接', async ({ page }) => {
      // 监听WebSocket连接
      const wsPromise = page.waitForEvent('websocket');
      
      // 进入AI对话页面
      await aiChatPage.navigate();
      
      // 等待WebSocket连接
      const ws = await wsPromise;
      expect(ws.url()).toMatch(/wss?:\/\//);
      
      // 验证连接状态
      await page.waitForTimeout(1000);
      const wsState = await page.evaluate(() => {
        // 检查是否有WebSocket实例
        return window.ws ? window.ws.readyState : -1;
      });
      
      // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
      expect(wsState).toBe(1); // OPEN
    });

    test('WebSocket重连机制', async ({ page }) => {
      await aiChatPage.navigate();
      
      // 等待初始连接
      await page.waitForTimeout(2000);
      
      // 模拟断开连接
      await page.evaluate(() => {
        if (window.ws) {
          window.ws.close();
        }
      });
      
      // 等待重连
      await page.waitForTimeout(5000);
      
      // 验证重连成功
      const reconnected = await page.evaluate(() => {
        return window.ws && window.ws.readyState === 1;
      });
      
      expect(reconnected).toBeTruthy();
    });

    test('处理连接错误', async ({ page }) => {
      // 设置离线状态
      await page.context().setOffline(true);
      
      // 尝试进入对话页面
      await aiChatPage.navigate();
      
      // 等待错误提示
      await page.waitForTimeout(3000);
      
      // 验证显示连接错误
      const hasError = await page.locator('.connection-error, .el-message--error').count() > 0;
      expect(hasError).toBeTruthy();
      
      // 恢复在线状态
      await page.context().setOffline(false);
    });
  });

  test.describe('实时消息', () => {
    test('发送和接收实时消息', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 监听WebSocket消息
      let messageReceived = false;
      page.on('websocket', ws => {
        ws.on('framereceived', ({ payload }) => {
          if (payload.toString().includes('message')) {
            messageReceived = true;
          }
        });
      });
      
      // 发送消息
      await aiChatPage.sendMessage('WebSocket测试消息');
      
      // 等待响应
      await aiChatPage.waitForAIResponse();
      
      // 验证收到WebSocket消息
      expect(messageReceived).toBeTruthy();
    });

    test('实时打字效果', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 发送消息
      await aiChatPage.sendMessage('测试打字效果');
      
      // 检查打字指示器
      const typingIndicator = await page.locator('.typing-indicator, .ai-typing').isVisible();
      expect(typingIndicator).toBeTruthy();
      
      // 等待打字完成
      await aiChatPage.waitForAIResponse();
      
      // 验证打字指示器消失
      const typingGone = await page.locator('.typing-indicator, .ai-typing').isHidden();
      expect(typingGone).toBeTruthy();
    });

    test('消息状态更新', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 发送消息
      await aiChatPage.sendMessage('测试消息状态');
      
      // 获取消息元素
      const lastMessage = await page.locator('.message-user').last();
      
      // 检查发送中状态
      const sendingStatus = await lastMessage.locator('.status-sending').count() > 0;
      expect(sendingStatus).toBeTruthy();
      
      // 等待发送完成
      await page.waitForTimeout(2000);
      
      // 检查已发送状态
      const sentStatus = await lastMessage.locator('.status-sent, .status-delivered').count() > 0;
      expect(sentStatus).toBeTruthy();
    });
  });

  test.describe('多用户协作', () => {
    test('实时协作编辑', async ({ browser }) => {
      // 创建两个浏览器上下文模拟两个用户
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        // 用户1登录
        const loginPage1 = new LoginPage(page1);
        await loginPage1.navigate();
        await loginPage1.login('user1@example.com', 'Test123456!');
        
        // 用户2登录
        const loginPage2 = new LoginPage(page2);
        await loginPage2.navigate();
        await loginPage2.login('user2@example.com', 'Test123456!');
        
        // 两个用户进入同一个协作空间（如果支持）
        const aiChatPage1 = new AIChatPage(page1);
        const aiChatPage2 = new AIChatPage(page2);
        
        await aiChatPage1.navigate();
        await aiChatPage2.navigate();
        
        // 用户1发送消息
        await aiChatPage1.sendMessage('来自用户1的消息');
        
        // 等待同步
        await page2.waitForTimeout(3000);
        
        // 验证用户2能看到消息（如果支持实时协作）
        const messagesOnPage2 = await aiChatPage2.getMessageCount();
        expect(messagesOnPage2).toBeGreaterThan(0);
        
      } finally {
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('WebSocket性能', () => {
    test('消息延迟测试', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 记录发送时间
      const sendTime = Date.now();
      
      // 监听响应时间
      let receiveTime;
      page.on('websocket', ws => {
        ws.on('framereceived', () => {
          if (!receiveTime) {
            receiveTime = Date.now();
          }
        });
      });
      
      // 发送消息
      await aiChatPage.sendMessage('延迟测试');
      
      // 等待响应
      await page.waitForTimeout(1000);
      
      // 计算延迟
      if (receiveTime) {
        const latency = receiveTime - sendTime;
        console.log(`WebSocket延迟: ${latency}ms`);
        
        // 验证延迟在合理范围内（如小于1秒）
        expect(latency).toBeLessThan(1000);
      }
    });

    test('并发消息处理', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 快速发送多条消息
      const messages = ['消息1', '消息2', '消息3', '消息4', '消息5'];
      
      for (const msg of messages) {
        await aiChatPage.sendMessage(msg);
        await page.waitForTimeout(100); // 短暂延迟
      }
      
      // 等待所有响应
      await page.waitForTimeout(10000);
      
      // 验证消息数量
      const totalMessages = await aiChatPage.getMessageCount();
      expect(totalMessages).toBeGreaterThanOrEqual(messages.length * 2); // 用户消息 + AI响应
    });
  });

  test.describe('离线支持', () => {
    test('离线消息队列', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 设置离线
      await page.context().setOffline(true);
      
      // 尝试发送消息
      await aiChatPage.sendMessage('离线消息');
      
      // 验证消息进入队列（显示待发送状态）
      const pendingMessage = await page.locator('.message-pending, .status-pending').count() > 0;
      expect(pendingMessage).toBeTruthy();
      
      // 恢复在线
      await page.context().setOffline(false);
      
      // 等待消息发送
      await page.waitForTimeout(3000);
      
      // 验证消息已发送
      const sentMessage = await page.locator('.message-sent, .status-sent').count() > 0;
      expect(sentMessage).toBeTruthy();
    });

    test('断线重连后的消息同步', async ({ page }) => {
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      // 发送一条消息
      await aiChatPage.sendMessage('同步测试消息');
      await aiChatPage.waitForAIResponse();
      
      const messageCountBefore = await aiChatPage.getMessageCount();
      
      // 模拟断线
      await page.evaluate(() => {
        if (window.ws) window.ws.close();
      });
      
      // 等待重连
      await page.waitForTimeout(5000);
      
      // 验证消息仍然存在
      const messageCountAfter = await aiChatPage.getMessageCount();
      expect(messageCountAfter).toBe(messageCountBefore);
    });
  });
});