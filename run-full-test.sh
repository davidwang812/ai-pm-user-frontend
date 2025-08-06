#!/bin/bash

# AI产品经理 - 完整测试执行脚本

set -e

echo "================================================"
echo "AI产品经理 - E2E测试执行器"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
export TEST_BASE_URL=${TEST_BASE_URL:-"https://ai-pm-user-frontend.vercel.app"}
export TEST_API_URL=${TEST_API_URL:-"https://ai-product-manager-production.up.railway.app"}
export TEST_TIMEOUT=${TEST_TIMEOUT:-30000}
export TEST_RETRY=${TEST_RETRY:-2}

# 创建测试结果目录
mkdir -p test-results
mkdir -p test-results/screenshots
mkdir -p test-results/videos
mkdir -p playwright-report

# 打印配置信息
echo -e "${BLUE}测试配置:${NC}"
echo "- 前端URL: $TEST_BASE_URL"
echo "- API URL: $TEST_API_URL"
echo "- 超时时间: $TEST_TIMEOUT ms"
echo "- 重试次数: $TEST_RETRY"
echo ""

# 检查依赖
echo -e "${BLUE}检查依赖...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到npm${NC}"
    exit 1
fi

# 安装Playwright（如果需要）
if ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}安装Playwright...${NC}"
    npx playwright install
fi

# 清理旧的测试结果
echo -e "${BLUE}清理旧的测试结果...${NC}"
rm -rf test-results/*
rm -rf playwright-report/*

# 运行测试前的健康检查
echo -e "${BLUE}执行健康检查...${NC}"
echo -n "检查前端可访问性... "
if curl -s -o /dev/null -w "%{http_code}" "$TEST_BASE_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}警告: 前端可能无法访问${NC}"
fi

echo -n "检查API可访问性... "
if curl -s -o /dev/null -w "%{http_code}" "$TEST_API_URL/api/health" | grep -q "200\|404"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}警告: API可能无法访问${NC}"
fi
echo ""

# 运行不同类型的测试
run_test_suite() {
    local suite_name=$1
    local test_pattern=$2
    
    echo -e "${BLUE}运行 $suite_name 测试...${NC}"
    
    if npx playwright test $test_pattern --reporter=json,html --output=test-results/${suite_name}-results.json; then
        echo -e "${GREEN}✓ $suite_name 测试通过${NC}"
        return 0
    else
        echo -e "${RED}✗ $suite_name 测试失败${NC}"
        return 1
    fi
}

# 主测试执行
echo -e "${BLUE}开始执行测试套件...${NC}"
echo ""

# 记录开始时间
start_time=$(date +%s)

# 测试结果统计
total_suites=0
passed_suites=0
failed_suites=0

# 1. 认证测试
((total_suites++))
if run_test_suite "认证" "tests/e2e/specs/auth.spec.js"; then
    ((passed_suites++))
else
    ((failed_suites++))
fi
echo ""

# 2. AI对话测试
((total_suites++))
if run_test_suite "AI对话" "tests/e2e/specs/ai-chat.spec.js"; then
    ((passed_suites++))
else
    ((failed_suites++))
fi
echo ""

# 3. 产品管理测试
((total_suites++))
if run_test_suite "产品管理" "tests/e2e/specs/product.spec.js"; then
    ((passed_suites++))
else
    ((failed_suites++))
fi
echo ""

# 4. WebSocket测试
((total_suites++))
if run_test_suite "WebSocket" "tests/e2e/specs/websocket.spec.js"; then
    ((passed_suites++))
else
    ((failed_suites++))
fi
echo ""

# 5. 性能测试
((total_suites++))
if run_test_suite "性能" "tests/e2e/specs/performance.spec.js"; then
    ((passed_suites++))
else
    ((failed_suites++))
fi
echo ""

# 记录结束时间
end_time=$(date +%s)
duration=$((end_time - start_time))

# 收集测试结果
echo -e "${BLUE}收集测试结果...${NC}"
node tests/e2e/utils/result-collector.js

# 生成测试摘要
echo ""
echo "================================================"
echo -e "${BLUE}测试执行摘要${NC}"
echo "================================================"
echo "执行时间: ${duration}秒"
echo "测试套件: ${total_suites}"
echo -e "通过: ${GREEN}${passed_suites}${NC}"
echo -e "失败: ${RED}${failed_suites}${NC}"
echo "通过率: $(( passed_suites * 100 / total_suites ))%"
echo ""

# 显示失败的测试详情
if [ $failed_suites -gt 0 ]; then
    echo -e "${RED}失败的测试详情:${NC}"
    # 这里可以解析JSON结果文件显示具体失败的测试
    echo "(请查看 playwright-report/index.html 了解详情)"
    echo ""
fi

# 生成报告链接
echo -e "${BLUE}测试报告:${NC}"
echo "- HTML报告: file://$(pwd)/playwright-report/index.html"
echo "- 测试仪表板: file://$(pwd)/tests/dashboard/index.html"
echo "- 截图目录: $(pwd)/test-results/screenshots"
echo ""

# 询问是否打开报告
echo -e "${YELLOW}是否打开HTML报告? (y/n)${NC}"
read -r open_report
if [[ $open_report == "y" || $open_report == "Y" ]]; then
    npx playwright show-report
fi

# 返回测试状态
if [ $failed_suites -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有测试失败，请检查报告${NC}"
    exit 1
fi