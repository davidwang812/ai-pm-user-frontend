import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import HomePage from '../pages/HomePage.js';
import AIChatPage from '../pages/AIChatPage.js';
import ProductPage from '../pages/ProductPage.js';

test.describe('性能测试', () => {
  test.describe('页面加载性能', () => {
    test('首页加载时间', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      console.log(`首页加载时间: ${loadTime}ms`);
      
      // 验证加载时间在3秒内
      expect(loadTime).toBeLessThan(3000);
      
      // 收集性能指标
      const metrics = await page.evaluate(() => {
        const timing = window.performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
        };
      });
      
      console.log('性能指标:', metrics);
      
      // 验证关键指标
      expect(metrics.firstContentfulPaint).toBeLessThan(1500); // FCP < 1.5秒
      expect(metrics.domContentLoaded).toBeLessThan(2000); // DOM加载 < 2秒
    });

    test('登录页面性能', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // 测量导航时间
      const navigationTiming = await page.evaluate(async () => {
        const startTime = Date.now();
        await new Promise(resolve => {
          window.addEventListener('load', resolve);
          window.location.href = '/#/login';
        });
        return Date.now() - startTime;
      }).catch(() => 0);
      
      await loginPage.navigate();
      
      // 获取资源加载情况
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(r => ({
          name: r.name.split('/').pop(),
          duration: Math.round(r.duration),
          size: r.transferSize,
          type: r.initiatorType
        }));
      });
      
      // 分析大文件
      const largeResources = resources.filter(r => r.size > 100000); // > 100KB
      console.log('大文件资源:', largeResources);
      
      // 验证没有过大的资源
      const maxResourceSize = Math.max(...resources.map(r => r.size || 0));
      expect(maxResourceSize).toBeLessThan(5000000); // < 5MB
    });

    test('Core Web Vitals', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 等待页面稳定
      await page.waitForTimeout(3000);
      
      // 获取Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let lcp = 0;
          let fid = 0;
          let cls = 0;
          
          // LCP (Largest Contentful Paint)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.renderTime || lastEntry.loadTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // CLS (Cumulative Layout Shift)
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });
          
          // 等待收集数据
          setTimeout(() => {
            resolve({ lcp, cls, fid });
          }, 2000);
        });
      });
      
      console.log('Core Web Vitals:', webVitals);
      
      // 验证性能指标符合Google推荐值
      expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5秒
      expect(webVitals.cls).toBeLessThan(0.1); // CLS < 0.1
    });
  });

  test.describe('API响应性能', () => {
    test('登录API响应时间', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // 监听API请求
      const responseTime = await page.evaluate(async () => {
        const startTime = Date.now();
        
        try {
          const response = await fetch('/api/user/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'Test123456!'
            })
          });
          
          return {
            time: Date.now() - startTime,
            status: response.status,
            ok: response.ok
          };
        } catch (error) {
          return { time: Date.now() - startTime, error: error.message };
        }
      });
      
      console.log('登录API响应:', responseTime);
      
      // 验证响应时间
      expect(responseTime.time).toBeLessThan(2000); // < 2秒
    });

    test('产品列表API性能', async ({ page }) => {
      // 先登录
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      await loginPage.isLoginSuccessful();
      
      // 测试产品列表API
      const apiPerformance = await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const measurements = [];
        
        // 测试不同页面大小
        const pageSizes = [10, 50, 100];
        
        for (const size of pageSizes) {
          const startTime = Date.now();
          
          try {
            const response = await fetch(`/api/products?limit=${size}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            const endTime = Date.now();
            
            measurements.push({
              pageSize: size,
              responseTime: endTime - startTime,
              dataSize: JSON.stringify(data).length,
              itemCount: data.data?.length || 0
            });
          } catch (error) {
            measurements.push({
              pageSize: size,
              error: error.message
            });
          }
        }
        
        return measurements;
      });
      
      console.log('产品列表API性能:', apiPerformance);
      
      // 验证响应时间随数据量线性增长
      for (const measurement of apiPerformance) {
        if (!measurement.error) {
          const timePerItem = measurement.responseTime / (measurement.itemCount || 1);
          expect(timePerItem).toBeLessThan(50); // 每项 < 50ms
        }
      }
    });
  });

  test.describe('内存和资源使用', () => {
    test('内存泄漏检测', async ({ page }) => {
      // 先登录
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      
      const aiChatPage = new AIChatPage(page);
      
      // 获取初始内存使用
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // 执行重复操作
      for (let i = 0; i < 5; i++) {
        await aiChatPage.navigate();
        await aiChatPage.sendMessage(`测试消息 ${i}`);
        await page.waitForTimeout(2000);
        await page.goto('/#/products');
        await page.waitForTimeout(1000);
      }
      
      // 强制垃圾回收（如果可用）
      await page.evaluate(() => {
        if (window.gc) window.gc();
      });
      
      await page.waitForTimeout(2000);
      
      // 获取最终内存使用
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      console.log(`内存使用: 初始=${initialMemory}, 最终=${finalMemory}, 增长=${finalMemory - initialMemory}`);
      
      // 验证内存增长在合理范围内（如增长不超过50%）
      if (initialMemory > 0) {
        const memoryGrowth = (finalMemory - initialMemory) / initialMemory;
        expect(memoryGrowth).toBeLessThan(0.5);
      }
    });

    test('DOM节点数量监控', async ({ page }) => {
      const productPage = new ProductPage(page);
      
      // 登录
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      
      // 导航到产品列表
      await productPage.navigate();
      await productPage.waitForProductList();
      
      // 获取DOM节点数量
      const domStats = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const listeners = [];
        
        // 统计事件监听器（简化版）
        allElements.forEach(el => {
          const events = getEventListeners ? getEventListeners(el) : {};
          listeners.push(Object.keys(events).length);
        });
        
        return {
          totalNodes: allElements.length,
          maxDepth: (() => {
            let maxDepth = 0;
            const getDepth = (el, depth = 0) => {
              maxDepth = Math.max(maxDepth, depth);
              Array.from(el.children).forEach(child => getDepth(child, depth + 1));
            };
            getDepth(document.body);
            return maxDepth;
          })(),
          totalListeners: listeners.reduce((a, b) => a + b, 0)
        };
      });
      
      console.log('DOM统计:', domStats);
      
      // 验证DOM复杂度
      expect(domStats.totalNodes).toBeLessThan(3000); // 总节点数 < 3000
      expect(domStats.maxDepth).toBeLessThan(50); // 最大深度 < 50
    });
  });

  test.describe('并发和负载测试', () => {
    test('并发用户登录', async ({ browser }) => {
      const userCount = 5;
      const contexts = [];
      const results = [];
      
      // 创建多个浏览器上下文
      for (let i = 0; i < userCount; i++) {
        contexts.push(await browser.newContext());
      }
      
      // 并发执行登录
      const startTime = Date.now();
      
      const loginPromises = contexts.map(async (context, index) => {
        const page = await context.newPage();
        const loginPage = new LoginPage(page);
        
        const userStartTime = Date.now();
        
        try {
          await loginPage.navigate();
          await loginPage.login(`user${index}@example.com`, 'Test123456!');
          
          const success = await loginPage.isLoginSuccessful();
          
          results.push({
            user: index,
            success,
            time: Date.now() - userStartTime
          });
        } catch (error) {
          results.push({
            user: index,
            success: false,
            error: error.message,
            time: Date.now() - userStartTime
          });
        }
        
        await page.close();
      });
      
      await Promise.all(loginPromises);
      
      const totalTime = Date.now() - startTime;
      
      console.log('并发登录结果:', {
        totalTime,
        averageTime: totalTime / userCount,
        results
      });
      
      // 清理
      for (const context of contexts) {
        await context.close();
      }
      
      // 验证所有用户都能在合理时间内完成
      const maxUserTime = Math.max(...results.map(r => r.time));
      expect(maxUserTime).toBeLessThan(10000); // 最慢的用户 < 10秒
    });

    test('高频消息发送性能', async ({ page }) => {
      // 登录
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      
      const aiChatPage = new AIChatPage(page);
      await aiChatPage.navigate();
      await aiChatPage.waitForChatInterface();
      
      const messageCount = 10;
      const sendTimes = [];
      
      // 快速发送多条消息
      for (let i = 0; i < messageCount; i++) {
        const startTime = Date.now();
        await aiChatPage.sendMessage(`性能测试消息 ${i}`);
        sendTimes.push(Date.now() - startTime);
        
        // 极短的间隔
        await page.waitForTimeout(100);
      }
      
      console.log('消息发送时间:', {
        times: sendTimes,
        average: sendTimes.reduce((a, b) => a + b) / sendTimes.length,
        max: Math.max(...sendTimes),
        min: Math.min(...sendTimes)
      });
      
      // 验证消息发送性能
      const avgSendTime = sendTimes.reduce((a, b) => a + b) / sendTimes.length;
      expect(avgSendTime).toBeLessThan(500); // 平均发送时间 < 500ms
    });
  });

  test.describe('缓存性能', () => {
    test('静态资源缓存', async ({ page }) => {
      // 第一次访问
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 获取资源加载情况
      const firstLoad = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter(r => 
          r.name.includes('.js') || r.name.includes('.css')
        ).map(r => ({
          name: r.name.split('/').pop(),
          duration: r.duration,
          fromCache: r.transferSize === 0
        }));
      });
      
      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 再次获取资源加载情况
      const secondLoad = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter(r => 
          r.name.includes('.js') || r.name.includes('.css')
        ).map(r => ({
          name: r.name.split('/').pop(),
          duration: r.duration,
          fromCache: r.transferSize === 0
        }));
      });
      
      console.log('缓存效果:', {
        firstLoad: firstLoad.filter(r => !r.fromCache).length,
        secondLoad: secondLoad.filter(r => !r.fromCache).length,
        cacheHitRate: (secondLoad.filter(r => r.fromCache).length / secondLoad.length * 100).toFixed(2) + '%'
      });
      
      // 验证缓存命中率
      const cacheHitRate = secondLoad.filter(r => r.fromCache).length / secondLoad.length;
      expect(cacheHitRate).toBeGreaterThan(0.7); // 缓存命中率 > 70%
    });

    test('API响应缓存', async ({ page }) => {
      // 登录
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@example.com', 'Test123456!');
      
      // 第一次请求
      const firstRequest = await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const startTime = Date.now();
        
        const response = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return {
          time: Date.now() - startTime,
          headers: Object.fromEntries(response.headers.entries())
        };
      });
      
      // 第二次请求（应该更快）
      const secondRequest = await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const startTime = Date.now();
        
        const response = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return {
          time: Date.now() - startTime,
          headers: Object.fromEntries(response.headers.entries())
        };
      });
      
      console.log('API缓存效果:', {
        firstTime: firstRequest.time,
        secondTime: secondRequest.time,
        improvement: ((firstRequest.time - secondRequest.time) / firstRequest.time * 100).toFixed(2) + '%'
      });
      
      // 如果有缓存，第二次应该更快
      if (firstRequest.headers['cache-control'] && !firstRequest.headers['cache-control'].includes('no-cache')) {
        expect(secondRequest.time).toBeLessThan(firstRequest.time);
      }
    });
  });
});