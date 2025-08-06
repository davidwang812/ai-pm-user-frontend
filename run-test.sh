#!/bin/bash

# AI产品经理 - 简单测试运行脚本

echo "🚀 AI产品经理前端测试"
echo "====================="
echo ""

# 设置环境变量
export TEST_BASE_URL="https://ai-pm-user-frontend.vercel.app"

# 创建必要的目录
mkdir -p test-results/screenshots
mkdir -p test-results/videos

echo "📋 选择测试类型:"
echo "1) 快速测试 - 只运行Chrome登录测试"
echo "2) 认证测试 - 运行所有认证相关测试"
echo "3) AI测试 - 运行AI对话测试"
echo "4) 完整测试 - 运行所有测试"
echo "5) 有界面测试 - 打开浏览器运行"
echo ""

read -p "请选择 (1-5): " choice

case $choice in
  1)
    echo "运行快速测试..."
    npx playwright test tests/e2e/specs/auth.spec.js -g "成功登录" --project=chromium
    ;;
  2)
    echo "运行认证测试..."
    npx playwright test tests/e2e/specs/auth.spec.js --project=chromium
    ;;
  3)
    echo "运行AI测试..."
    npx playwright test tests/e2e/specs/ai-chat.spec.js --project=chromium
    ;;
  4)
    echo "运行完整测试..."
    npx playwright test
    ;;
  5)
    echo "运行有界面测试..."
    npx playwright test tests/e2e/specs/auth.spec.js -g "成功登录" --project=chromium --headed
    ;;
  *)
    echo "无效选择"
    exit 1
    ;;
esac

echo ""
echo "✅ 测试完成!"
echo ""
echo "查看报告: npx playwright show-report"