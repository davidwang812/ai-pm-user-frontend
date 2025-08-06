import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestValidator {
  constructor() {
    this.validationResults = {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0,
      errors: []
    };
  }

  // 验证测试用例结构
  validateTestCase(testCase, fileName) {
    const errors = [];
    const warnings = [];
    
    // 必需字段
    if (!testCase.name) {
      errors.push(`缺少必需字段 'name' in ${fileName}`);
    }
    
    if (!testCase.cases || !Array.isArray(testCase.cases)) {
      errors.push(`缺少或无效的 'cases' 字段 in ${fileName}`);
    } else {
      // 验证每个测试案例
      testCase.cases.forEach((testItem, index) => {
        if (!testItem.name) {
          errors.push(`测试案例 #${index + 1} 缺少 'name' 字段 in ${fileName}`);
        }
        
        if (!testItem.steps || !Array.isArray(testItem.steps)) {
          errors.push(`测试案例 '${testItem.name || index}' 缺少 'steps' in ${fileName}`);
        } else {
          // 验证步骤
          testItem.steps.forEach((step, stepIndex) => {
            if (!step.action) {
              errors.push(`步骤 #${stepIndex + 1} 缺少 'action' in 测试案例 '${testItem.name}' of ${fileName}`);
            }
            
            // 验证动作类型
            const validActions = ['navigate', 'click', 'type', 'select', 'assert', 'wait', 'screenshot'];
            if (step.action && !validActions.includes(step.action)) {
              warnings.push(`未知的动作类型 '${step.action}' in ${fileName}`);
            }
            
            // 某些动作需要特定字段
            if (step.action === 'type' && !step.value) {
              errors.push(`'type' 动作缺少 'value' 字段 in ${fileName}`);
            }
            
            if (step.action === 'assert' && !step.expected) {
              errors.push(`'assert' 动作缺少 'expected' 字段 in ${fileName}`);
            }
          });
        }
      });
    }
    
    return { errors, warnings };
  }

  // 验证Page Object
  validatePageObject(filePath) {
    const errors = [];
    const warnings = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查必需的imports
      if (!content.includes('import BasePage')) {
        warnings.push(`${filePath} 可能没有继承 BasePage`);
      }
      
      // 检查类定义
      if (!content.includes('class') || !content.includes('extends')) {
        errors.push(`${filePath} 缺少正确的类定义`);
      }
      
      // 检查构造函数
      if (!content.includes('constructor')) {
        warnings.push(`${filePath} 缺少构造函数`);
      }
      
      // 检查导出
      if (!content.includes('export default')) {
        errors.push(`${filePath} 缺少默认导出`);
      }
      
      // 检查常见的Page Object方法
      const commonMethods = ['navigate', 'waitFor'];
      commonMethods.forEach(method => {
        if (!content.includes(method)) {
          warnings.push(`${filePath} 可能缺少 '${method}' 方法`);
        }
      });
      
    } catch (error) {
      errors.push(`无法读取文件 ${filePath}: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  // 验证测试规范
  validateTestSpec(filePath) {
    const errors = [];
    const warnings = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查imports
      if (!content.includes('@playwright/test')) {
        errors.push(`${filePath} 缺少 Playwright test 导入`);
      }
      
      // 检查test.describe
      if (!content.includes('test.describe')) {
        warnings.push(`${filePath} 没有使用 test.describe 组织测试`);
      }
      
      // 检查至少有一个测试
      if (!content.includes('test(')) {
        errors.push(`${filePath} 没有定义任何测试`);
      }
      
      // 检查断言
      if (!content.includes('expect')) {
        warnings.push(`${filePath} 可能缺少断言`);
      }
      
      // 检查异步处理
      const asyncCount = (content.match(/async/g) || []).length;
      const awaitCount = (content.match(/await/g) || []).length;
      if (asyncCount > 0 && awaitCount === 0) {
        warnings.push(`${filePath} 使用了 async 但没有 await`);
      }
      
    } catch (error) {
      errors.push(`无法读取文件 ${filePath}: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  // 验证整个测试套件
  async validateTestSuite() {
    console.log('开始验证测试套件...\n');
    
    // 验证目录结构
    const requiredDirs = [
      'tests/e2e/pages',
      'tests/e2e/specs',
      'tests/e2e/test-cases',
      'tests/e2e/utils'
    ];
    
    console.log('检查目录结构...');
    requiredDirs.forEach(dir => {
      const fullPath = path.join(__dirname, '../../../', dir);
      if (fs.existsSync(fullPath)) {
        console.log(`✓ ${dir}`);
      } else {
        console.log(`✗ ${dir} - 缺失`);
        this.validationResults.errors.push(`缺少必需目录: ${dir}`);
      }
    });
    
    // 验证YAML测试用例
    console.log('\n验证YAML测试用例...');
    const testCasesDir = path.join(__dirname, '../test-cases');
    if (fs.existsSync(testCasesDir)) {
      const yamlFiles = fs.readdirSync(testCasesDir).filter(f => f.endsWith('.yaml'));
      
      yamlFiles.forEach(file => {
        this.validationResults.total++;
        const filePath = path.join(testCasesDir, file);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const testCase = yaml.load(content);
          const { errors, warnings } = this.validateTestCase(testCase, file);
          
          if (errors.length === 0) {
            this.validationResults.valid++;
            console.log(`✓ ${file}`);
          } else {
            this.validationResults.invalid++;
            console.log(`✗ ${file}`);
            errors.forEach(e => console.log(`  - 错误: ${e}`));
          }
          
          if (warnings.length > 0) {
            this.validationResults.warnings += warnings.length;
            warnings.forEach(w => console.log(`  - 警告: ${w}`));
          }
          
          this.validationResults.errors.push(...errors);
          
        } catch (error) {
          this.validationResults.invalid++;
          console.log(`✗ ${file} - 解析错误: ${error.message}`);
          this.validationResults.errors.push(`${file}: ${error.message}`);
        }
      });
    }
    
    // 验证Page Objects
    console.log('\n验证Page Objects...');
    const pagesDir = path.join(__dirname, '../pages');
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js'));
      
      pageFiles.forEach(file => {
        this.validationResults.total++;
        const filePath = path.join(pagesDir, file);
        const { errors, warnings } = this.validatePageObject(filePath);
        
        if (errors.length === 0) {
          this.validationResults.valid++;
          console.log(`✓ ${file}`);
        } else {
          this.validationResults.invalid++;
          console.log(`✗ ${file}`);
          errors.forEach(e => console.log(`  - 错误: ${e}`));
        }
        
        if (warnings.length > 0) {
          this.validationResults.warnings += warnings.length;
          warnings.forEach(w => console.log(`  - 警告: ${w}`));
        }
        
        this.validationResults.errors.push(...errors);
      });
    }
    
    // 验证测试规范
    console.log('\n验证测试规范...');
    const specsDir = path.join(__dirname, '../specs');
    if (fs.existsSync(specsDir)) {
      const specFiles = fs.readdirSync(specsDir).filter(f => f.endsWith('.spec.js'));
      
      specFiles.forEach(file => {
        this.validationResults.total++;
        const filePath = path.join(specsDir, file);
        const { errors, warnings } = this.validateTestSpec(filePath);
        
        if (errors.length === 0) {
          this.validationResults.valid++;
          console.log(`✓ ${file}`);
        } else {
          this.validationResults.invalid++;
          console.log(`✗ ${file}`);
          errors.forEach(e => console.log(`  - 错误: ${e}`));
        }
        
        if (warnings.length > 0) {
          this.validationResults.warnings += warnings.length;
          warnings.forEach(w => console.log(`  - 警告: ${w}`));
        }
        
        this.validationResults.errors.push(...errors);
      });
    }
    
    // 打印摘要
    this.printSummary();
    
    return this.validationResults;
  }

  // 打印验证摘要
  printSummary() {
    console.log('\n========================================');
    console.log('验证摘要');
    console.log('========================================');
    console.log(`总文件数: ${this.validationResults.total}`);
    console.log(`有效文件: ${this.validationResults.valid}`);
    console.log(`无效文件: ${this.validationResults.invalid}`);
    console.log(`警告数: ${this.validationResults.warnings}`);
    console.log(`错误数: ${this.validationResults.errors.length}`);
    
    if (this.validationResults.errors.length === 0) {
      console.log('\n✅ 所有验证通过！');
    } else {
      console.log('\n❌ 发现验证错误，请修复后再运行测试');
    }
  }

  // 生成验证报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.validationResults,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../../../test-results/validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n验证报告已保存至: ${reportPath}`);
    
    return report;
  }

  // 生成改进建议
  generateRecommendations() {
    const recommendations = [];
    
    if (this.validationResults.errors.length > 0) {
      recommendations.push({
        type: 'error',
        message: '修复所有验证错误以确保测试能正常运行'
      });
    }
    
    if (this.validationResults.warnings > 10) {
      recommendations.push({
        type: 'warning',
        message: '警告数量较多，建议逐步改进代码质量'
      });
    }
    
    // 检查测试覆盖率
    const specFiles = fs.readdirSync(path.join(__dirname, '../specs')).filter(f => f.endsWith('.spec.js'));
    if (specFiles.length < 5) {
      recommendations.push({
        type: 'info',
        message: '测试文件较少，考虑增加更多测试覆盖'
      });
    }
    
    return recommendations;
  }
}

// CLI接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new TestValidator();
  
  validator.validateTestSuite()
    .then(results => {
      validator.generateReport();
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('验证失败:', error);
      process.exit(1);
    });
}

export default TestValidator;