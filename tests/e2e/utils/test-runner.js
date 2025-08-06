const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class TestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.TEST_BASE_URL || 'https://ai-pm-user-frontend.vercel.app';
    this.resultsDir = options.resultsDir || 'test-results';
    this.testCasesDir = options.testCasesDir || 'tests/test-cases';
  }

  // 运行YAML测试用例
  async runYamlTest(yamlFile) {
    try {
      const testCase = yaml.load(fs.readFileSync(yamlFile, 'utf8'));
      console.log(`运行测试: ${testCase.name}`);
      
      // 将YAML测试转换为Playwright命令
      const results = {
        name: testCase.name,
        description: testCase.description,
        scenarios: []
      };

      for (const scenario of testCase.scenarios || []) {
        console.log(`  场景: ${scenario.name}`);
        const scenarioResult = {
          name: scenario.name,
          steps: [],
          status: 'passed',
          error: null
        };

        try {
          // 这里可以实现将YAML步骤转换为实际的测试代码
          // 目前仅作为示例
          for (const step of scenario.steps) {
            console.log(`    - ${step}`);
            scenarioResult.steps.push({
              description: step,
              status: 'passed'
            });
          }
        } catch (error) {
          scenarioResult.status = 'failed';
          scenarioResult.error = error.message;
        }

        results.scenarios.push(scenarioResult);
      }

      return results;
    } catch (error) {
      console.error(`运行YAML测试失败: ${error.message}`);
      throw error;
    }
  }

  // 运行Playwright测试
  runPlaywrightTests(testFile = '', options = {}) {
    const env = {
      ...process.env,
      TEST_BASE_URL: this.baseUrl
    };

    const args = [
      'npx',
      'playwright',
      'test'
    ];

    if (testFile) {
      args.push(testFile);
    }

    if (options.project) {
      args.push('--project', options.project);
    }

    if (options.headed) {
      args.push('--headed');
    }

    if (options.debug) {
      args.push('--debug');
    }

    try {
      console.log(`运行命令: ${args.join(' ')}`);
      const result = execSync(args.join(' '), {
        env,
        stdio: 'inherit'
      });
      return true;
    } catch (error) {
      console.error('测试运行失败');
      return false;
    }
  }

  // 生成测试报告
  generateReport() {
    try {
      execSync('npx playwright show-report', {
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('生成报告失败:', error.message);
    }
  }

  // 清理测试结果
  cleanResults() {
    if (fs.existsSync(this.resultsDir)) {
      fs.rmSync(this.resultsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.resultsDir, { recursive: true });
    fs.mkdirSync(path.join(this.resultsDir, 'screenshots'), { recursive: true });
    fs.mkdirSync(path.join(this.resultsDir, 'videos'), { recursive: true });
  }

  // 运行测试套件
  async runTestSuite(suiteName) {
    console.log(`\n🧪 运行测试套件: ${suiteName}`);
    console.log('='.repeat(50));
    
    this.cleanResults();
    
    const startTime = Date.now();
    const success = this.runPlaywrightTests('', {
      project: suiteName
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ 测试完成，耗时: ${(duration / 1000).toFixed(2)}秒`);
    
    if (success) {
      console.log('📊 生成测试报告...');
      this.generateReport();
    }
    
    return success;
  }

  // 运行快速冒烟测试
  runSmokeTests() {
    console.log('\n🚀 运行冒烟测试...');
    return this.runPlaywrightTests('tests/e2e/specs/auth.spec.js', {
      project: 'chromium'
    });
  }

  // 运行完整测试
  runFullTests() {
    console.log('\n🔧 运行完整测试套件...');
    return this.runPlaywrightTests();
  }

  // 调试模式运行
  runDebugMode(testFile) {
    console.log('\n🐛 调试模式...');
    return this.runPlaywrightTests(testFile, {
      headed: true,
      debug: true
    });
  }
}

// 命令行接口
if (require.main === module) {
  const runner = new TestRunner();
  const command = process.argv[2];

  switch (command) {
    case 'smoke':
      runner.runSmokeTests();
      break;
    case 'full':
      runner.runFullTests();
      break;
    case 'debug':
      const debugFile = process.argv[3];
      runner.runDebugMode(debugFile);
      break;
    case 'report':
      runner.generateReport();
      break;
    case 'clean':
      runner.cleanResults();
      console.log('✨ 测试结果已清理');
      break;
    default:
      console.log(`
AI产品经理 - 自动化测试运行器

使用方法:
  node test-runner.js <command> [options]

命令:
  smoke    - 运行快速冒烟测试
  full     - 运行完整测试套件
  debug    - 调试模式运行指定测试
  report   - 生成并打开测试报告
  clean    - 清理测试结果

示例:
  node test-runner.js smoke
  node test-runner.js debug tests/e2e/specs/auth.spec.js
  node test-runner.js report
      `);
  }
}

module.exports = TestRunner;