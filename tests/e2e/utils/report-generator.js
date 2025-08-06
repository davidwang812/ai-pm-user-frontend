import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportGenerator {
  constructor() {
    this.resultsDir = path.join(__dirname, '../../../test-results');
    this.reportDir = path.join(this.resultsDir, 'custom-report');
  }

  // 生成测试报告
  async generateReport(testResults) {
    // 确保报告目录存在
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(testResults);
    fs.writeFileSync(path.join(this.reportDir, 'index.html'), htmlReport);

    // 生成JSON报告
    const jsonReport = this.generateJSONReport(testResults);
    fs.writeFileSync(
      path.join(this.reportDir, 'report.json'), 
      JSON.stringify(jsonReport, null, 2)
    );

    // 生成Markdown报告
    const mdReport = this.generateMarkdownReport(testResults);
    fs.writeFileSync(path.join(this.reportDir, 'report.md'), mdReport);

    console.log(`✅ 报告已生成: ${this.reportDir}`);
  }

  // 生成HTML报告
  generateHTMLReport(results) {
    const { summary, testCases, duration } = results;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI产品经理 - 测试报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-card h3 {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .passed { color: #52c41a; }
    .failed { color: #f5222d; }
    .skipped { color: #faad14; }
    .test-suite {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .test-case {
      padding: 10px;
      border-left: 3px solid #e8e8e8;
      margin: 10px 0;
    }
    .test-case.passed {
      border-left-color: #52c41a;
    }
    .test-case.failed {
      border-left-color: #f5222d;
    }
    .test-case.skipped {
      border-left-color: #faad14;
    }
    .error-details {
      background: #fff2f0;
      border: 1px solid #ffccc7;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .screenshot {
      margin: 10px 0;
    }
    .screenshot img {
      max-width: 100%;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #666;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI产品经理 - 自动化测试报告</h1>
    <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    <p>测试环境: ${process.env.TEST_BASE_URL || 'production'}</p>
    <p>执行时长: ${duration}秒</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>总测试数</h3>
      <div class="value">${summary.total}</div>
    </div>
    <div class="summary-card">
      <h3>通过</h3>
      <div class="value passed">${summary.passed}</div>
    </div>
    <div class="summary-card">
      <h3>失败</h3>
      <div class="value failed">${summary.failed}</div>
    </div>
    <div class="summary-card">
      <h3>跳过</h3>
      <div class="value skipped">${summary.skipped}</div>
    </div>
    <div class="summary-card">
      <h3>通过率</h3>
      <div class="value">${summary.passRate}%</div>
    </div>
  </div>

  ${this.generateTestSuitesHTML(testCases)}

  <div class="footer">
    <p>由 Playwright + AI产品经理测试框架 生成</p>
  </div>
</body>
</html>
    `;
  }

  // 生成测试套件HTML
  generateTestSuitesHTML(testCases) {
    let html = '';
    
    const suites = this.groupBySuite(testCases);
    
    for (const [suiteName, cases] of Object.entries(suites)) {
      html += `
        <div class="test-suite">
          <h2>${suiteName}</h2>
          ${cases.map(tc => this.generateTestCaseHTML(tc)).join('')}
        </div>
      `;
    }
    
    return html;
  }

  // 生成单个测试用例HTML
  generateTestCaseHTML(testCase) {
    const statusClass = testCase.status.toLowerCase();
    let html = `
      <div class="test-case ${statusClass}">
        <h3>${testCase.status === 'passed' ? '✅' : testCase.status === 'failed' ? '❌' : '⏭️'} ${testCase.name}</h3>
        <p>耗时: ${testCase.duration}ms</p>
    `;
    
    if (testCase.error) {
      html += `
        <div class="error-details">
          ${testCase.error}
        </div>
      `;
    }
    
    if (testCase.screenshot) {
      html += `
        <div class="screenshot">
          <img src="${testCase.screenshot}" alt="测试截图">
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  // 生成JSON报告
  generateJSONReport(results) {
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.TEST_BASE_URL || 'production',
        browser: process.env.TEST_BROWSER || 'chromium',
        duration: results.duration
      },
      summary: results.summary,
      testCases: results.testCases,
      failures: results.testCases.filter(tc => tc.status === 'failed'),
      screenshots: results.screenshots || [],
      videos: results.videos || []
    };
  }

  // 生成Markdown报告
  generateMarkdownReport(results) {
    const { summary, testCases } = results;
    
    let md = `# AI产品经理 - 测试报告

## 📊 测试总结

- **总测试数**: ${summary.total}
- **通过**: ${summary.passed} ✅
- **失败**: ${summary.failed} ❌
- **跳过**: ${summary.skipped} ⏭️
- **通过率**: ${summary.passRate}%
- **执行时间**: ${results.duration}秒

## 🧪 测试详情

`;

    const suites = this.groupBySuite(testCases);
    
    for (const [suiteName, cases] of Object.entries(suites)) {
      md += `### ${suiteName}\n\n`;
      
      for (const testCase of cases) {
        const icon = testCase.status === 'passed' ? '✅' : 
                    testCase.status === 'failed' ? '❌' : '⏭️';
        
        md += `- ${icon} **${testCase.name}** (${testCase.duration}ms)\n`;
        
        if (testCase.error) {
          md += `  - 错误: \`${testCase.error}\`\n`;
        }
      }
      
      md += '\n';
    }

    if (summary.failed > 0) {
      md += `## ❌ 失败的测试\n\n`;
      
      const failures = testCases.filter(tc => tc.status === 'failed');
      for (const failure of failures) {
        md += `### ${failure.name}\n`;
        md += `- **套件**: ${failure.suite}\n`;
        md += `- **错误**: ${failure.error}\n`;
        if (failure.screenshot) {
          md += `- **截图**: [查看截图](${failure.screenshot})\n`;
        }
        md += '\n';
      }
    }

    md += `## 📝 环境信息

- **测试环境**: ${process.env.TEST_BASE_URL || 'production'}
- **浏览器**: ${process.env.TEST_BROWSER || 'chromium'}
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
`;

    return md;
  }

  // 按套件分组测试用例
  groupBySuite(testCases) {
    const suites = {};
    
    for (const testCase of testCases) {
      const suite = testCase.suite || '未分类';
      if (!suites[suite]) {
        suites[suite] = [];
      }
      suites[suite].push(testCase);
    }
    
    return suites;
  }

  // 从Playwright结果生成报告数据
  parsePlaywrightResults(playwrightReport) {
    const testCases = [];
    let totalDuration = 0;
    
    // 解析Playwright的JSON报告
    if (playwrightReport.suites) {
      for (const suite of playwrightReport.suites) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            testCases.push({
              name: test.title,
              suite: suite.title,
              status: test.status,
              duration: test.duration,
              error: test.error?.message,
              screenshot: test.attachments?.find(a => a.name === 'screenshot')?.path
            });
            totalDuration += test.duration || 0;
          }
        }
      }
    }
    
    // 计算总结数据
    const summary = {
      total: testCases.length,
      passed: testCases.filter(tc => tc.status === 'passed').length,
      failed: testCases.filter(tc => tc.status === 'failed').length,
      skipped: testCases.filter(tc => tc.status === 'skipped').length,
      passRate: 0
    };
    
    if (summary.total > 0) {
      summary.passRate = Math.round((summary.passed / summary.total) * 100);
    }
    
    return {
      summary,
      testCases,
      duration: Math.round(totalDuration / 1000)
    };
  }
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ReportGenerator();
  
  // 读取Playwright的测试结果
  const resultPath = path.join(generator.resultsDir, 'test-results.json');
  
  if (fs.existsSync(resultPath)) {
    const playwrightReport = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    const reportData = generator.parsePlaywrightResults(playwrightReport);
    generator.generateReport(reportData);
  } else {
    // 生成示例报告
    const sampleData = {
      summary: {
        total: 15,
        passed: 12,
        failed: 2,
        skipped: 1,
        passRate: 80
      },
      testCases: [
        {
          name: '成功登录有效用户',
          suite: '用户认证测试',
          status: 'passed',
          duration: 1234
        },
        {
          name: '无效凭据登录失败',
          suite: '用户认证测试',
          status: 'passed',
          duration: 567
        },
        {
          name: '空字段验证',
          suite: '用户认证测试',
          status: 'failed',
          duration: 890,
          error: 'Expected form validation error'
        }
      ],
      duration: 45
    };
    
    generator.generateReport(sampleData);
  }
}

export default ReportGenerator;