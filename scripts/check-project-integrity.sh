#!/bin/bash

# 项目完整性检查脚本
# 用途：在构建和部署前验证项目文件的完整性

set -e

echo "🔍 开始项目完整性检查..."
echo "================================"

# 错误计数
ERROR_COUNT=0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 - 文件缺失"
        ((ERROR_COUNT++))
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ - 目录缺失"
        ((ERROR_COUNT++))
        return 1
    fi
}

echo -e "\n📁 检查核心文件..."
CORE_FILES=(
    "index.html"
    "package.json"
    "package-lock.json"
    "vite.config.js"
    ".gitignore"
    "README.md"
)

for file in "${CORE_FILES[@]}"; do
    check_file "$file"
done

echo -e "\n📁 检查源代码结构..."
SOURCE_DIRS=(
    "src"
    "src/assets"
    "src/components"
    "src/modules"
    "src/router"
    "src/store"
    "src/services"
    "src/utils"
)

for dir in "${SOURCE_DIRS[@]}"; do
    check_directory "$dir"
done

echo -e "\n📁 检查关键源文件..."
SOURCE_FILES=(
    "src/main.js"
    "src/App.vue"
    "src/router/index.js"
    "src/store/index.js"
)

for file in "${SOURCE_FILES[@]}"; do
    check_file "$file"
done

echo -e "\n📁 检查样式文件..."
STYLE_FILES=(
    "src/assets/styles/variables.scss"
    "src/assets/styles/mixins.scss"
    "src/assets/styles/transitions.scss"
    "src/assets/styles/global.scss"
)

for file in "${STYLE_FILES[@]}"; do
    check_file "$file"
done

echo -e "\n📦 检查依赖完整性..."
if [ -f "package.json" ]; then
    # 检查关键依赖
    REQUIRED_DEPS=("vue" "vue-router" "pinia" "element-plus" "axios")
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "${GREEN}✓${NC} 依赖 $dep 已声明"
        else
            echo -e "${RED}✗${NC} 依赖 $dep 未找到"
            ((ERROR_COUNT++))
        fi
    done
fi

echo -e "\n🔧 检查配置文件..."
CONFIG_FILES=(
    ".env.example"
    ".eslintrc.js"
    "jsconfig.json"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file (可选)"
    else
        echo -e "${YELLOW}⚠${NC}  $file - 建议添加"
    fi
done

echo -e "\n📊 检查导入路径..."
# 检查是否有错误的导入路径
IMPORT_ERRORS=$(grep -r "from '\.\./\.\./\.\./\.\." src/ 2>/dev/null | wc -l || echo "0")
if [ "$IMPORT_ERRORS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  发现 $IMPORT_ERRORS 个可能过深的导入路径"
fi

# 检查是否有硬编码的绝对路径
ABSOLUTE_PATHS=$(grep -r "from '/src" src/ 2>/dev/null | wc -l || echo "0")
if [ "$ABSOLUTE_PATHS" -gt 0 ]; then
    echo -e "${RED}✗${NC} 发现 $ABSOLUTE_PATHS 个绝对路径导入"
    ((ERROR_COUNT++))
fi

echo -e "\n================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ 项目完整性检查通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERROR_COUNT 个问题需要修复${NC}"
    exit 1
fi