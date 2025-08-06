import BasePage from './BasePage.js';

class ProductPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      // 列表页面
      productList: '.product-list, .el-table',
      productRow: '.el-table__row, tr[class*="product"]',
      productName: '.product-name, td:first-child',
      createButton: 'button:has-text("新建"), button:has-text("创建产品")',
      searchInput: 'input[placeholder*="搜索"], input[placeholder*="产品名称"]',
      searchButton: 'button:has-text("搜索")',
      
      // 分页
      pagination: '.el-pagination',
      totalCount: '.el-pagination__total',
      nextPageButton: '.el-pagination button.btn-next',
      prevPageButton: '.el-pagination button.btn-prev',
      currentPage: '.el-pagination .el-pager li.active',
      
      // 操作按钮
      editButton: 'button:has-text("编辑")',
      deleteButton: 'button:has-text("删除")',
      viewButton: 'button:has-text("查看"), button:has-text("详情")',
      
      // 表单页面
      productForm: '.product-form, form',
      nameInput: 'input[placeholder*="产品名称"]',
      descriptionInput: 'textarea[placeholder*="产品描述"]',
      targetUsersInput: 'input[placeholder*="目标用户"], textarea[placeholder*="目标用户"]',
      coreFeaturesInput: 'textarea[placeholder*="核心功能"]',
      businessModelInput: 'input[placeholder*="商业模式"], select[name="businessModel"]',
      competitiveAdvantageInput: 'textarea[placeholder*="竞争优势"]',
      submitButton: 'button[type="submit"], button:has-text("保存"), button:has-text("确定")',
      cancelButton: 'button:has-text("取消"), button:has-text("返回")',
      
      // 详情页面
      productDetail: '.product-detail, .product-info',
      detailName: '.detail-name, h1',
      detailDescription: '.detail-description',
      backButton: 'button:has-text("返回"), a:has-text("返回")',
      
      // 批量操作
      selectCheckbox: '.el-table__row .el-checkbox',
      selectAllCheckbox: '.el-table__header .el-checkbox',
      batchDeleteButton: 'button:has-text("批量删除")',
      selectedCount: '.selected-count',
      
      // 确认对话框
      confirmDialog: '.el-message-box, .el-dialog',
      confirmButton: '.el-message-box__btns .el-button--primary',
      cancelDialogButton: '.el-message-box__btns .el-button--default',
      
      // 消息提示
      successMessage: '.el-message--success',
      errorMessage: '.el-message--error',
      formError: '.el-form-item__error'
    };
  }

  async navigate() {
    await super.navigate('/#/products');
    await this.waitForLoadComplete();
  }

  async waitForProductList() {
    await this.waitForElement(this.selectors.productList);
    await this.page.waitForTimeout(1000); // 等待数据加载
  }

  async waitForProductForm() {
    await this.waitForElement(this.selectors.productForm);
    await this.waitForElement(this.selectors.nameInput);
  }

  async waitForProductDetail() {
    await this.waitForElement(this.selectors.productDetail);
  }

  async getProductCount() {
    return await this.page.locator(this.selectors.productRow).count();
  }

  async getTotalProductCount() {
    const totalText = await this.getText(this.selectors.totalCount);
    const match = totalText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async hasProductTable() {
    return await this.isVisible(this.selectors.productList);
  }

  async getFirstProductName() {
    const firstRow = await this.page.locator(this.selectors.productRow).first();
    return await firstRow.locator(this.selectors.productName).textContent();
  }

  async searchProduct(keyword) {
    await this.fill(this.selectors.searchInput, keyword);
    
    // 尝试点击搜索按钮，如果没有则按回车
    const hasSearchButton = await this.page.locator(this.selectors.searchButton).count() > 0;
    if (hasSearchButton) {
      await this.click(this.selectors.searchButton);
    } else {
      await this.page.keyboard.press('Enter');
    }
    
    await this.page.waitForTimeout(1000);
  }

  async hasNextPage() {
    const nextButton = await this.page.locator(this.selectors.nextPageButton);
    return await nextButton.isEnabled();
  }

  async goToNextPage() {
    await this.click(this.selectors.nextPageButton);
    await this.page.waitForTimeout(1000);
  }

  async getCurrentPage() {
    const pageText = await this.getText(this.selectors.currentPage);
    return parseInt(pageText);
  }

  async clickCreateProduct() {
    await this.click(this.selectors.createButton);
  }

  async fillProductForm(data) {
    if (data.name) await this.fill(this.selectors.nameInput, data.name);
    if (data.description) await this.fill(this.selectors.descriptionInput, data.description);
    if (data.targetUsers) await this.fill(this.selectors.targetUsersInput, data.targetUsers);
    if (data.coreFeatures) await this.fill(this.selectors.coreFeaturesInput, data.coreFeatures);
    if (data.businessModel) {
      // 处理下拉选择或输入
      const isSelect = await this.page.locator('select[name="businessModel"]').count() > 0;
      if (isSelect) {
        await this.page.selectOption(this.selectors.businessModelInput, data.businessModel);
      } else {
        await this.fill(this.selectors.businessModelInput, data.businessModel);
      }
    }
    if (data.competitiveAdvantage) {
      await this.fill(this.selectors.competitiveAdvantageInput, data.competitiveAdvantage);
    }
  }

  async fillProductName(name) {
    await this.fill(this.selectors.nameInput, name);
  }

  async fillProductDescription(description) {
    await this.fill(this.selectors.descriptionInput, description);
  }

  async submitProduct() {
    await this.click(this.selectors.submitButton);
    await this.page.waitForTimeout(1000);
  }

  async cancelEdit() {
    await this.click(this.selectors.cancelButton);
    await this.page.waitForTimeout(500);
  }

  async getFormErrors() {
    const errors = await this.page.locator(this.selectors.formError).allTextContents();
    return errors;
  }

  async getFieldError(fieldName) {
    const fieldSelectors = {
      name: this.selectors.nameInput,
      description: this.selectors.descriptionInput,
      targetUsers: this.selectors.targetUsersInput
    };
    
    const fieldSelector = fieldSelectors[fieldName];
    if (!fieldSelector) return null;
    
    const errorElement = await this.page.locator(fieldSelector)
      .locator('xpath=../..')
      .locator(this.selectors.formError);
    
    if (await errorElement.count() > 0) {
      return await errorElement.textContent();
    }
    
    return null;
  }

  async editProduct(index) {
    const rows = await this.page.locator(this.selectors.productRow).all();
    if (rows[index]) {
      await rows[index].hover();
      await rows[index].locator(this.selectors.editButton).click();
    }
  }

  async deleteProduct(index) {
    const rows = await this.page.locator(this.selectors.productRow).all();
    if (rows[index]) {
      await rows[index].hover();
      await rows[index].locator(this.selectors.deleteButton).click();
    }
  }

  async viewProductDetail(index) {
    const rows = await this.page.locator(this.selectors.productRow).all();
    if (rows[index]) {
      await rows[index].hover();
      await rows[index].locator(this.selectors.viewButton).click();
    }
  }

  async confirmDelete() {
    await this.waitForElement(this.selectors.confirmDialog);
    await this.click(this.selectors.confirmButton);
    await this.page.waitForTimeout(500);
  }

  async cancelDelete() {
    await this.waitForElement(this.selectors.confirmDialog);
    await this.click(this.selectors.cancelDialogButton);
    await this.page.waitForTimeout(500);
  }

  async hasProductDetailInfo() {
    return await this.isVisible(this.selectors.productDetail);
  }

  async getDetailProductName() {
    return await this.getText(this.selectors.detailName);
  }

  async getDetailDescription() {
    return await this.getText(this.selectors.detailDescription);
  }

  async backToList() {
    await this.click(this.selectors.backButton);
  }

  async isOnProductListPage() {
    return await this.isVisible(this.selectors.productList);
  }

  async selectProduct(index) {
    const checkboxes = await this.page.locator(this.selectors.selectCheckbox).all();
    if (checkboxes[index]) {
      await checkboxes[index].click();
    }
  }

  async selectAll() {
    await this.click(this.selectors.selectAllCheckbox);
  }

  async unselectAll() {
    await this.click(this.selectors.selectAllCheckbox);
  }

  async getSelectedCount() {
    // 计算选中的复选框数量
    const checkboxes = await this.page.locator(this.selectors.selectCheckbox + ' input:checked').count();
    return checkboxes;
  }

  async batchDelete() {
    await this.click(this.selectors.batchDeleteButton);
  }

  async confirmBatchDelete() {
    await this.confirmDelete();
  }
}

export default ProductPage;