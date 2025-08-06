#!/bin/bash

# AI产品经理用户端 - 测试执行脚本
# 用法: ./run-tests.sh [选项]

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认值
TEST_ENV="production"
TEST_BROWSER="chromium"
TEST_MODE="headless"
TEST_SUITE="all"

# 显示帮助
show_help() {
    echo "AI产品经理用户端 - 自动化测试脚本"
    echo ""
    echo "用法: ./run-tests.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -e, --env <环境>        测试环境 (local|dev|production) [默认: production]"
    echo "  -b, --browser <浏览器>   浏览器类型 (chromium|firefox|webkit|all) [默认: chromium]"
    echo "  -m, --mode <模式>       运行模式 (headless|headed|debug) [默认: headless]"
    echo "  -s, --suite <套件>      测试套件 (smoke|auth|ai|product|all) [默认: all]"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./run-tests.sh                     # 运行所有测试"
    echo "  ./run-tests.sh -s smoke            # 运行冒烟测试"
    echo "  ./run-tests.sh -m headed -s auth   # 有头模式运行认证测试"
    echo "  ./run-tests.sh -e local -m debug   # 本地调试模式"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            TEST_ENV="$2"
            shift 2
            ;;
        -b|--browser)
            TEST_BROWSER="$2"
            shift 2
            ;;
        -m|--mode)
            TEST_MODE="$2"
            shift 2
            ;;
        -s|--suite)
            TEST_SUITE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 设置环境URL
case $TEST_ENV in
    local)
        export TEST_BASE_URL="http://localhost:5173"
        ;;
    dev)
        export TEST_BASE_URL="https://dev.ai-pm-user.vercel.app"
        ;;
    production)
        export TEST_BASE_URL="https://ai-pm-user-frontend.vercel.app"
        ;;
    *)
        echo -e "${RED}错误: 未知的环境 '$TEST_ENV'${NC}"
        exit 1
        ;;
esac

# 显示测试配置
echo -e "${BLUE}📋 测试配置${NC}"
echo "================================"
echo -e "环境: ${GREEN}$TEST_ENV${NC} ($TEST_BASE_URL)"
echo -e "浏览器: ${GREEN}$TEST_BROWSER${NC}"
echo -e "模式: ${GREEN}$TEST_MODE${NC}"
echo -e "套件: ${GREEN}$TEST_SUITE${NC}"
echo "================================"
echo ""

# 检查依赖
echo -e "${BLUE}🔍 检查依赖...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    exit 1
fi

if ! [ -f "node_modules/.bin/playwright" ]; then
    echo -e "${YELLOW}警告: Playwright 未安装，正在安装...${NC}"
    npm install
    npm run test:install
fi

# 清理旧的测试结果
echo -e "${BLUE}🧹 清理旧的测试结果...${NC}"
rm -rf test-results
mkdir -p test-results/{screenshots,videos,reports}

# 构建测试命令
TEST_CMD="npx playwright test"

# 添加浏览器选项
if [ "$TEST_BROWSER" != "all" ]; then
    TEST_CMD="$TEST_CMD --project=$TEST_BROWSER"
fi

# 添加模式选项
case $TEST_MODE in
    headed)
        TEST_CMD="$TEST_CMD --headed"
        ;;
    debug)
        TEST_CMD="$TEST_CMD --debug"
        ;;
esac

# 添加测试套件选项
case $TEST_SUITE in
    smoke)
        TEST_CMD="$TEST_CMD tests/e2e/specs/auth.spec.js"
        ;;
    auth)
        TEST_CMD="$TEST_CMD tests/e2e/specs/auth.spec.js"
        ;;
    ai)
        TEST_CMD="$TEST_CMD tests/e2e/specs/ai-chat.spec.js"
        ;;
    product)
        TEST_CMD="$TEST_CMD tests/e2e/specs/product.spec.js"
        ;;
    all)
        # 运行所有测试
        ;;
    *)
        echo -e "${RED}错误: 未知的测试套件 '$TEST_SUITE'${NC}"
        exit 1
        ;;
esac

# 运行测试
echo -e "${BLUE}🚀 开始运行测试...${NC}"
echo "命令: $TEST_CMD"
echo ""

# 记录开始时间
START_TIME=$(date +%s)

# 执行测试
if $TEST_CMD; then
    TEST_RESULT=0
    echo -e "${GREEN}✅ 测试通过！${NC}"
else
    TEST_RESULT=$?
    echo -e "${RED}❌ 测试失败！${NC}"
fi

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 显示测试总结
echo ""
echo -e "${BLUE}📊 测试总结${NC}"
echo "================================"
echo -e "执行时间: ${YELLOW}${DURATION}秒${NC}"
echo -e "测试结果: $([ $TEST_RESULT -eq 0 ] && echo -e "${GREEN}通过${NC}" || echo -e "${RED}失败${NC}")"
echo ""

# 生成报告
if [ -f "test-results/html-report/index.html" ]; then
    echo -e "${BLUE}📈 测试报告已生成${NC}"
    echo "报告位置: test-results/html-report/index.html"
    
    # 如果是本地环境，自动打开报告
    if [ "$TEST_ENV" = "local" ] && [ "$TEST_MODE" != "debug" ]; then
        echo -e "${BLUE}正在打开测试报告...${NC}"
        npx playwright show-report || true
    fi
fi

# 检查截图和视频
SCREENSHOT_COUNT=$(find test-results -name "*.png" 2>/dev/null | wc -l)
VIDEO_COUNT=$(find test-results -name "*.webm" 2>/dev/null | wc -l)

if [ $SCREENSHOT_COUNT -gt 0 ]; then
    echo -e "${YELLOW}📸 生成了 $SCREENSHOT_COUNT 张截图${NC}"
fi

if [ $VIDEO_COUNT -gt 0 ]; then
    echo -e "${YELLOW}🎬 生成了 $VIDEO_COUNT 个测试视频${NC}"
fi

echo "================================"

# 退出码
exit $TEST_RESULT