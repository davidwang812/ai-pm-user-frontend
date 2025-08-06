import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestMonitor {
  constructor() {
    this.startTime = Date.now();
    this.tests = [];
    this.currentTest = null;
    this.metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      duration: 0
    };
  }

  // 开始监控测试
  startTest(testName, suite) {
    this.currentTest = {
      name: testName,
      suite: suite,
      startTime: Date.now(),
      steps: [],
      status: 'running'
    };
    
    console.log(chalk.blue(`▶ 开始测试: ${suite} - ${testName}`));
  }

  // 添加测试步骤
  addStep(description, status = 'running') {
    if (this.currentTest) {
      const step = {
        description,
        status,
        timestamp: Date.now()
      };
      
      this.currentTest.steps.push(step);
      
      const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⋯';
      const color = status === 'passed' ? 'green' : status === 'failed' ? 'red' : 'gray';
      console.log(chalk[color](`  ${icon} ${description}`));
    }
  }

  // 结束测试
  endTest(status, error = null) {
    if (this.currentTest) {
      this.currentTest.endTime = Date.now();
      this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
      this.currentTest.status = status;
      this.currentTest.error = error;
      
      this.tests.push(this.currentTest);
      this.metrics.total++;
      this.metrics[status]++;
      
      const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⊘';
      const color = status === 'passed' ? 'green' : status === 'failed' ? 'red' : 'yellow';
      
      console.log(chalk[color](`${icon} 完成测试: ${this.currentTest.name} (${this.currentTest.duration}ms)`));
      
      if (error) {
        console.log(chalk.red(`  错误: ${error}`));
      }
      
      this.currentTest = null;
    }
  }

  // 实时显示进度
  showProgress() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const passRate = this.metrics.total > 0 
      ? Math.round((this.metrics.passed / this.metrics.total) * 100) 
      : 0;
    
    console.log(chalk.cyan('\n📊 测试进度:'));
    console.log(`  总计: ${this.metrics.total}`);
    console.log(chalk.green(`  通过: ${this.metrics.passed}`));
    console.log(chalk.red(`  失败: ${this.metrics.failed}`));
    console.log(chalk.yellow(`  跳过: ${this.metrics.skipped}`));
    console.log(`  通过率: ${passRate}%`);
    console.log(`  用时: ${elapsed}秒\n`);
  }

  // 生成实时报告
  generateLiveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      metrics: this.metrics,
      tests: this.tests,
      currentTest: this.currentTest,
      summary: this.generateSummary()
    };
    
    // 保存到临时文件供仪表板读取
    const reportPath = path.join(__dirname, '../../../test-results/live-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  // 生成摘要
  generateSummary() {
    const passRate = this.metrics.total > 0 
      ? Math.round((this.metrics.passed / this.metrics.total) * 100) 
      : 0;
    
    const failedTests = this.tests.filter(t => t.status === 'failed');
    const slowTests = this.tests.filter(t => t.duration > 5000).sort((a, b) => b.duration - a.duration);
    
    return {
      passRate,
      failedTests: failedTests.map(t => ({
        name: t.name,
        suite: t.suite,
        error: t.error,
        duration: t.duration
      })),
      slowTests: slowTests.slice(0, 5).map(t => ({
        name: t.name,
        suite: t.suite,
        duration: t.duration
      })),
      avgDuration: this.tests.length > 0 
        ? Math.round(this.tests.reduce((sum, t) => sum + t.duration, 0) / this.tests.length)
        : 0
    };
  }

  // 检测不稳定的测试
  detectFlakyTests() {
    const testRuns = {};
    
    // 统计每个测试的运行结果
    this.tests.forEach(test => {
      const key = `${test.suite}:${test.name}`;
      if (!testRuns[key]) {
        testRuns[key] = [];
      }
      testRuns[key].push(test.status);
    });
    
    // 找出结果不一致的测试
    const flakyTests = [];
    Object.entries(testRuns).forEach(([key, results]) => {
      if (results.length > 1) {
        const uniqueResults = [...new Set(results)];
        if (uniqueResults.length > 1) {
          const [suite, name] = key.split(':');
          flakyTests.push({
            suite,
            name,
            results: results,
            flakyRate: Math.round((results.filter(r => r === 'failed').length / results.length) * 100)
          });
        }
      }
    });
    
    return flakyTests;
  }

  // 生成性能报告
  generatePerformanceReport() {
    const performanceData = {
      suites: {},
      overall: {
        totalDuration: Date.now() - this.startTime,
        avgTestDuration: 0,
        slowestTest: null,
        fastestTest: null
      }
    };
    
    // 按套件分组统计
    this.tests.forEach(test => {
      if (!performanceData.suites[test.suite]) {
        performanceData.suites[test.suite] = {
          tests: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      
      performanceData.suites[test.suite].tests++;
      performanceData.suites[test.suite].totalDuration += test.duration;
    });
    
    // 计算平均值
    Object.values(performanceData.suites).forEach(suite => {
      suite.avgDuration = Math.round(suite.totalDuration / suite.tests);
    });
    
    // 找出最慢和最快的测试
    if (this.tests.length > 0) {
      const sorted = [...this.tests].sort((a, b) => a.duration - b.duration);
      performanceData.overall.fastestTest = {
        name: sorted[0].name,
        suite: sorted[0].suite,
        duration: sorted[0].duration
      };
      performanceData.overall.slowestTest = {
        name: sorted[sorted.length - 1].name,
        suite: sorted[sorted.length - 1].suite,
        duration: sorted[sorted.length - 1].duration
      };
      
      performanceData.overall.avgTestDuration = Math.round(
        this.tests.reduce((sum, t) => sum + t.duration, 0) / this.tests.length
      );
    }
    
    return performanceData;
  }

  // 输出最终报告
  printFinalReport() {
    console.log(chalk.bold.cyan('\n\n========================================'));
    console.log(chalk.bold.cyan('          测试执行完成'));
    console.log(chalk.bold.cyan('========================================\n'));
    
    // 基本统计
    this.showProgress();
    
    // 失败的测试
    const failedTests = this.tests.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      console.log(chalk.red('\n❌ 失败的测试:'));
      failedTests.forEach((test, index) => {
        console.log(chalk.red(`\n${index + 1}. ${test.suite} - ${test.name}`));
        if (test.error) {
          console.log(chalk.gray(`   错误: ${test.error}`));
        }
        // 显示失败的步骤
        const failedSteps = test.steps.filter(s => s.status === 'failed');
        if (failedSteps.length > 0) {
          console.log(chalk.gray('   失败步骤:'));
          failedSteps.forEach(step => {
            console.log(chalk.gray(`   - ${step.description}`));
          });
        }
      });
    }
    
    // 性能报告
    const perfReport = this.generatePerformanceReport();
    console.log(chalk.cyan('\n⚡ 性能分析:'));
    console.log(`  总执行时间: ${Math.round(perfReport.overall.totalDuration / 1000)}秒`);
    console.log(`  平均测试时间: ${perfReport.overall.avgTestDuration}ms`);
    
    if (perfReport.overall.slowestTest) {
      console.log(chalk.yellow(`  最慢测试: ${perfReport.overall.slowestTest.name} (${perfReport.overall.slowestTest.duration}ms)`));
    }
    
    // 不稳定的测试
    const flakyTests = this.detectFlakyTests();
    if (flakyTests.length > 0) {
      console.log(chalk.yellow('\n⚠️  不稳定的测试:'));
      flakyTests.forEach(test => {
        console.log(chalk.yellow(`  - ${test.suite} - ${test.name} (失败率: ${test.flakyRate}%)`));
      });
    }
    
    // 建议
    console.log(chalk.cyan('\n💡 建议:'));
    if (failedTests.length > 0) {
      console.log('  - 修复失败的测试后再次运行');
    }
    if (perfReport.overall.avgTestDuration > 3000) {
      console.log('  - 考虑优化测试性能，平均执行时间较长');
    }
    if (flakyTests.length > 0) {
      console.log('  - 调查并修复不稳定的测试');
    }
    
    console.log(chalk.cyan('\n📄 详细报告已保存至:'));
    console.log(`  - HTML报告: playwright-report/index.html`);
    console.log(`  - JSON数据: test-results/`);
    console.log(`  - 测试仪表板: tests/dashboard/index.html\n`);
  }
}

// 导出单例
const monitor = new TestMonitor();

// CLI模式
if (import.meta.url === `file://${process.argv[1]}`) {
  // 监听stdin输入
  process.stdin.on('data', (data) => {
    const command = data.toString().trim();
    
    switch (command) {
      case 'progress':
        monitor.showProgress();
        break;
      case 'report':
        monitor.generateLiveReport();
        console.log('实时报告已更新');
        break;
      case 'final':
        monitor.printFinalReport();
        break;
      default:
        console.log('命令: progress | report | final');
    }
  });
  
  console.log('测试监控器已启动...');
  console.log('命令: progress | report | final');
}

export default monitor;