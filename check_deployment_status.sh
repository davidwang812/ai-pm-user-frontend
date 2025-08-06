#!/bin/bash

echo "🔍 AI产品经理部署状态检查"
echo "=========================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URL定义
FRONTEND_URL="https://ai-pm-user-frontend.vercel.app"
BACKEND_URL="https://aiproductmanager-production.up.railway.app"
ADMIN_URL="https://ai-pm-admin-v3-prod.vercel.app"

# 检查函数
check_url() {
    local url=$1
    local name=$2
    
    echo -n "检查 $name: "
    
    # 获取HTTP状态码
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅ 在线 (HTTP $status)${NC}"
        return 0
    else
        echo -e "${RED}❌ 离线或异常 (HTTP $status)${NC}"
        return 1
    fi
}

# 检查API端点
check_api() {
    local url=$1
    local name=$2
    
    echo -n "检查 $name: "
    
    # 获取响应
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "status.*ok\|status.*healthy\|success.*true"; then
        echo -e "${GREEN}✅ API正常${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  API响应异常${NC}"
        echo "  响应: $(echo "$response" | head -c 100)..."
        return 1
    fi
}

echo "1. 基础服务检查"
echo "----------------"
check_url "$FRONTEND_URL" "用户端前端"
check_url "$BACKEND_URL" "后端API服务"
check_url "$ADMIN_URL" "管理端前端"
echo ""

echo "2. API健康检查"
echo "---------------"
check_api "$BACKEND_URL/health" "后端健康接口"
check_api "$FRONTEND_URL/api/health" "前端API代理"
echo ""

echo "3. 静态资源检查"
echo "----------------"
echo -n "检查前端HTML: "
if curl -s "$FRONTEND_URL" | grep -q '<div id="app">'; then
    echo -e "${GREEN}✅ Vue应用挂载点存在${NC}"
else
    echo -e "${RED}❌ Vue应用挂载点缺失${NC}"
fi

echo -n "检查前端标题: "
title=$(curl -s "$FRONTEND_URL" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
if [ -n "$title" ]; then
    echo -e "${GREEN}✅ 标题: $title${NC}"
else
    echo -e "${RED}❌ 标题缺失${NC}"
fi
echo ""

echo "4. 功能端点检查"
echo "----------------"
# 检查关键API端点（不需要认证的）
endpoints=(
    "/api/health|健康检查"
    "/api/v1/health|V1健康检查"
)

for endpoint_info in "${endpoints[@]}"; do
    IFS='|' read -r endpoint name <<< "$endpoint_info"
    echo -n "检查 $name ($endpoint): "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$endpoint")
    
    if [ "$status" = "200" ] || [ "$status" = "404" ]; then
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ 可访问${NC}"
        else
            echo -e "${YELLOW}⚠️  端点不存在 (404)${NC}"
        fi
    else
        echo -e "${RED}❌ 错误 (HTTP $status)${NC}"
    fi
done
echo ""

echo "5. 部署摘要"
echo "------------"
echo -e "${GREEN}✅ 已部署的服务：${NC}"
echo "  - 用户端: $FRONTEND_URL"
echo "  - 后端API: $BACKEND_URL"
echo "  - 管理端: $ADMIN_URL"
echo ""
echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "  - 某些API需要登录认证才能访问"
echo "  - WebSocket连接需要在浏览器中测试"
echo "  - 完整功能测试请参考 BROWSER_TEST_GUIDE.md"
echo ""
echo "📅 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"