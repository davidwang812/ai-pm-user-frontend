#!/bin/bash

# 构建前检查脚本
# 确保构建不会因为常见问题而失败

set -e

echo "🔨 构建前检查开始..."
echo "======================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 错误标志
HAS_ERROR=false

# 1. 检查Node版本
echo -e "\n${BLUE}1. 检查Node.js版本${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    echo -e "${GREEN}✓${NC} Node.js版本 $NODE_VERSION (>= $REQUIRED_VERSION)"
else
    echo -e "${RED}✗${NC} Node.js版本过低: $NODE_VERSION (需要 >= $REQUIRED_VERSION)"
    HAS_ERROR=true
fi

# 2. 检查依赖安装
echo -e "\n${BLUE}2. 检查依赖安装${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules 存在"
    
    # 检查package-lock.json同步
    if [ -f "package-lock.json" ]; then
        if [ "package.json" -nt "node_modules" ]; then
            echo -e "${YELLOW}⚠${NC}  package.json 比 node_modules 新，建议运行 npm install"
        fi
    fi
else
    echo -e "${RED}✗${NC} node_modules 不存在，请先运行 npm install"
    HAS_ERROR=true
fi

# 3. 检查环境变量
echo -e "\n${BLUE}3. 检查环境变量${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"
else
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠${NC}  .env 文件不存在，但有 .env.example"
        echo "   建议: cp .env.example .env"
    else
        echo -e "${GREEN}✓${NC} 不需要 .env 文件"
    fi
fi

# 4. 检查TypeScript/JavaScript错误
echo -e "\n${BLUE}4. 检查代码语法${NC}"
if command -v eslint &> /dev/null; then
    echo "运行 ESLint 检查..."
    if npx eslint src --ext .js,.vue --max-warnings 0 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} ESLint 检查通过"
    else
        echo -e "${YELLOW}⚠${NC}  ESLint 发现问题，运行 'npm run lint' 查看详情"
    fi
else
    echo -e "${YELLOW}⚠${NC}  ESLint 未安装"
fi

# 5. 检查导入路径
echo -e "\n${BLUE}5. 检查导入路径${NC}"

# 检查相对路径导入深度
DEEP_IMPORTS=$(find src -name "*.js" -o -name "*.vue" | xargs grep -l "from '\.\./\.\./\.\./\.\." 2>/dev/null | wc -l || echo "0")
if [ "$DEEP_IMPORTS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 没有过深的相对路径导入"
else
    echo -e "${YELLOW}⚠${NC}  发现 $DEEP_IMPORTS 个文件有过深的相对路径，建议使用 @ 别名"
fi

# 检查循环依赖
echo -e "\n${BLUE}6. 检查潜在问题${NC}"

# 检查是否有console.log
CONSOLE_LOGS=$(find src -name "*.js" -o -name "*.vue" | xargs grep -l "console\.log" 2>/dev/null | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  发现 $CONSOLE_LOGS 个文件包含 console.log"
fi

# 检查未使用的依赖
echo -e "\n${BLUE}7. 依赖检查${NC}"
LARGE_DEPS=$(du -sh node_modules/* 2>/dev/null | sort -rh | head -5)
echo "最大的5个依赖包:"
echo "$LARGE_DEPS" | while read -r line; do
    echo "  $line"
done

# 8. 检查Vite配置
echo -e "\n${BLUE}8. 检查Vite配置${NC}"
if [ -f "vite.config.js" ]; then
    # 检查是否有optimizeDeps配置
    if grep -q "optimizeDeps" vite.config.js; then
        echo -e "${GREEN}✓${NC} Vite optimizeDeps 已配置"
    else
        echo -e "${YELLOW}⚠${NC}  建议添加 optimizeDeps 配置以优化依赖预构建"
    fi
fi

# 9. 模拟构建测试
echo -e "\n${BLUE}9. 模拟构建测试${NC}"
echo "运行快速构建测试..."
if npx vite build --mode development --logLevel silent > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 开发模式构建测试通过"
    # 清理测试构建
    rm -rf dist
else
    echo -e "${RED}✗${NC} 构建测试失败，请检查错误"
    HAS_ERROR=true
fi

# 总结
echo -e "\n======================"
if [ "$HAS_ERROR" = true ]; then
    echo -e "${RED}❌ 构建前检查发现错误，请先修复${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 构建前检查通过！${NC}"
    echo -e "${BLUE}提示：${NC}现在可以安全运行 'npm run build'"
fi