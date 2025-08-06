#!/bin/bash

# AI产品经理 - 示例测试执行脚本

set -e

echo "================================================"
echo "AI产品经理 - 示例测试执行"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 设置环境变量
export TEST_BASE_URL="https://ai-pm-user-frontend.vercel.app"
export NODE_OPTIONS="--experimental-modules"

echo -e "${BLUE}测试环境配置:${NC}"
echo "- 测试URL: $TEST_BASE_URL"
echo ""

# 检查并安装依赖
echo -e "${BLUE}检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖...${NC}"
    npm install
fi

# 安装Playwright浏览器
if [ ! -d "node_modules/playwright-core/.local-browsers" ]; then
    echo -e "${YELLOW}安装Playwright浏览器...${NC}"
    npx playwright install chromium
fi

# 运行验证器
echo -e "${BLUE}验证测试文件...${NC}"
node tests/e2e/utils/test-validator.js

# 运行单个测试示例（认证测试）
echo ""
echo -e "${BLUE}运行认证测试示例...${NC}"
npx playwright test tests/e2e/specs/auth.spec.js --headed --reporter=list

echo ""
echo -e "${GREEN}✅ 示例测试完成！${NC}"
echo ""
echo "要运行完整测试套件，请执行: ./run-full-test.sh"
echo "要查看测试报告，请执行: npm run test:report"