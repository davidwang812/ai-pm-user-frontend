import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import ProductPage from '../pages/ProductPage.js';

test.describe('产品管理功能测试', () => {
  let loginPage;
  let productPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productPage = new ProductPage(page);
    
    // 登录系统
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'Test123456!');
    await loginPage.isLoginSuccessful();
  });

  test.describe('产品列表', () => {
    test('查看产品列表', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      // 验证列表加载
      const productCount = await productPage.getProductCount();
      expect(productCount).toBeGreaterThanOrEqual(0);
      
      // 验证列表元素
      const hasTable = await productPage.hasProductTable();
      expect(hasTable).toBeTruthy();
    });

    test('搜索产品', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      // 执行搜索
      await productPage.searchProduct('测试');
      
      // 验证搜索结果
      const searchResults = await productPage.getProductCount();
      const firstProductName = await productPage.getFirstProductName();
      
      if (searchResults > 0) {
        expect(firstProductName.toLowerCase()).toContain('测试');
      }
    });

    test('产品列表分页', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const totalProducts = await productPage.getTotalProductCount();
      
      if (totalProducts > 10) {
        // 测试分页
        const hasNextPage = await productPage.hasNextPage();
        expect(hasNextPage).toBeTruthy();
        
        // 跳转到下一页
        await productPage.goToNextPage();
        
        // 验证页面变化
        const currentPage = await productPage.getCurrentPage();
        expect(currentPage).toBe(2);
      }
    });
  });

  test.describe('创建产品', () => {
    test('成功创建新产品', async ({ page }) => {
      await productPage.navigate();
      
      // 点击创建按钮
      await productPage.clickCreateProduct();
      await productPage.waitForProductForm();
      
      // 填写产品信息
      const productData = {
        name: `测试产品_${Date.now()}`,
        description: '这是一个自动化测试创建的产品',
        targetUsers: '测试用户群体',
        coreFeatures: '核心功能1\n核心功能2\n核心功能3',
        businessModel: '订阅制',
        competitiveAdvantage: '技术领先'
      };
      
      await productPage.fillProductForm(productData);
      
      // 提交表单
      await productPage.submitProduct();
      
      // 验证创建成功
      const successMessage = await productPage.getSuccessMessage();
      expect(successMessage).toMatch(/创建成功|保存成功/);
      
      // 验证返回列表
      await productPage.waitForProductList();
      
      // 搜索新创建的产品
      await productPage.searchProduct(productData.name);
      const foundProduct = await productPage.getFirstProductName();
      expect(foundProduct).toBe(productData.name);
    });

    test('必填字段验证', async ({ page }) => {
      await productPage.navigate();
      await productPage.clickCreateProduct();
      await productPage.waitForProductForm();
      
      // 直接提交空表单
      await productPage.submitProduct();
      
      // 验证错误提示
      const errors = await productPage.getFormErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // 验证具体字段错误
      const nameError = await productPage.getFieldError('name');
      expect(nameError).toMatch(/请输入产品名称|必填/);
    });

    test('产品名称长度限制', async ({ page }) => {
      await productPage.navigate();
      await productPage.clickCreateProduct();
      
      // 输入超长名称
      const longName = 'a'.repeat(101);
      await productPage.fillProductName(longName);
      await productPage.submitProduct();
      
      // 验证长度错误
      const nameError = await productPage.getFieldError('name');
      expect(nameError).toMatch(/长度|不能超过/);
    });
  });

  test.describe('编辑产品', () => {
    test('成功编辑产品信息', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount > 0) {
        // 编辑第一个产品
        await productPage.editProduct(0);
        await productPage.waitForProductForm();
        
        // 修改产品信息
        const updatedName = `更新的产品_${Date.now()}`;
        await productPage.fillProductName(updatedName);
        await productPage.fillProductDescription('更新的描述信息');
        
        // 保存修改
        await productPage.submitProduct();
        
        // 验证更新成功
        const successMessage = await productPage.getSuccessMessage();
        expect(successMessage).toMatch(/更新成功|保存成功/);
        
        // 验证更新生效
        await productPage.searchProduct(updatedName);
        const foundProduct = await productPage.getFirstProductName();
        expect(foundProduct).toBe(updatedName);
      } else {
        test.skip(true, '没有可编辑的产品');
      }
    });

    test('取消编辑', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount > 0) {
        const originalName = await productPage.getFirstProductName();
        
        // 进入编辑
        await productPage.editProduct(0);
        await productPage.waitForProductForm();
        
        // 修改但不保存
        await productPage.fillProductName('临时修改的名称');
        
        // 取消编辑
        await productPage.cancelEdit();
        
        // 验证返回列表
        await productPage.waitForProductList();
        
        // 验证名称未改变
        const currentName = await productPage.getFirstProductName();
        expect(currentName).toBe(originalName);
      }
    });
  });

  test.describe('删除产品', () => {
    test('成功删除产品', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const beforeCount = await productPage.getProductCount();
      
      if (beforeCount > 0) {
        const productName = await productPage.getFirstProductName();
        
        // 删除第一个产品
        await productPage.deleteProduct(0);
        
        // 确认删除
        await productPage.confirmDelete();
        
        // 验证删除成功
        const successMessage = await productPage.getSuccessMessage();
        expect(successMessage).toMatch(/删除成功/);
        
        // 验证产品数量减少
        const afterCount = await productPage.getProductCount();
        expect(afterCount).toBe(beforeCount - 1);
        
        // 验证产品不在列表中
        if (afterCount > 0) {
          await productPage.searchProduct(productName);
          const searchCount = await productPage.getProductCount();
          expect(searchCount).toBe(0);
        }
      } else {
        test.skip(true, '没有可删除的产品');
      }
    });

    test('取消删除', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const beforeCount = await productPage.getProductCount();
      
      if (beforeCount > 0) {
        // 尝试删除但取消
        await productPage.deleteProduct(0);
        await productPage.cancelDelete();
        
        // 验证产品数量未变
        const afterCount = await productPage.getProductCount();
        expect(afterCount).toBe(beforeCount);
      }
    });
  });

  test.describe('产品详情', () => {
    test('查看产品详情', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount > 0) {
        // 查看第一个产品详情
        await productPage.viewProductDetail(0);
        
        // 验证详情页面加载
        await productPage.waitForProductDetail();
        
        // 验证详情信息显示
        const hasProductInfo = await productPage.hasProductDetailInfo();
        expect(hasProductInfo).toBeTruthy();
        
        // 验证包含基本信息
        const productName = await productPage.getDetailProductName();
        expect(productName).toBeTruthy();
        
        const description = await productPage.getDetailDescription();
        expect(description).toBeTruthy();
      }
    });

    test('从详情页返回列表', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount > 0) {
        await productPage.viewProductDetail(0);
        await productPage.waitForProductDetail();
        
        // 返回列表
        await productPage.backToList();
        
        // 验证返回列表页
        await productPage.waitForProductList();
        const isOnListPage = await productPage.isOnProductListPage();
        expect(isOnListPage).toBeTruthy();
      }
    });
  });

  test.describe('批量操作', () => {
    test('批量删除产品', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount >= 2) {
        // 选择前两个产品
        await productPage.selectProduct(0);
        await productPage.selectProduct(1);
        
        // 执行批量删除
        await productPage.batchDelete();
        await productPage.confirmBatchDelete();
        
        // 验证删除成功
        const successMessage = await productPage.getSuccessMessage();
        expect(successMessage).toMatch(/批量删除|删除.*2.*产品/);
        
        // 验证产品数量减少
        const afterCount = await productPage.getProductCount();
        expect(afterCount).toBe(productCount - 2);
      } else {
        test.skip(true, '产品数量不足，无法测试批量删除');
      }
    });

    test('全选/取消全选', async ({ page }) => {
      await productPage.navigate();
      await productPage.waitForProductList();
      
      const productCount = await productPage.getProductCount();
      if (productCount > 0) {
        // 全选
        await productPage.selectAll();
        
        // 验证所有产品被选中
        const selectedCount = await productPage.getSelectedCount();
        expect(selectedCount).toBe(productCount);
        
        // 取消全选
        await productPage.unselectAll();
        
        // 验证没有产品被选中
        const unselectedCount = await productPage.getSelectedCount();
        expect(unselectedCount).toBe(0);
      }
    });
  });
});