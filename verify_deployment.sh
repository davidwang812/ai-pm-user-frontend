#!/bin/bash

echo "🔍 验证用户端部署状态..."
echo ""

# 预期的部署URL
DEPLOYMENT_URL="https://ai-pm-user-frontend.vercel.app"

# 检查部署是否成功
echo "1. 检查部署状态..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL")

if [ "$response" = "200" ]; then
    echo "✅ 部署成功！用户端已在 $DEPLOYMENT_URL 上线"
else
    echo "⚠️  部署可能还在进行中，HTTP状态码: $response"
    echo "   请稍后再试或访问: $DEPLOYMENT_URL"
fi

echo ""
echo "2. 检查前后端API连接配置..."

# 检查环境变量配置
if [ -f ".env.production" ]; then
    echo "✅ 找到生产环境配置文件"
    grep -E "VITE_API_BASE_URL|VITE_WS_URL" .env.production || echo "⚠️  未找到API配置"
else
    echo "ℹ️  未找到.env.production文件，将使用默认配置"
fi

echo ""
echo "3. 后端API状态..."
BACKEND_URL="https://aiproductmanager-production.up.railway.app"
api_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

if [ "$api_response" = "200" ]; then
    echo "✅ 后端API正常运行在: $BACKEND_URL"
else
    echo "⚠️  后端API响应异常，状态码: $api_response"
fi

echo ""
echo "📋 部署信息汇总："
echo "- 用户端URL: $DEPLOYMENT_URL"
echo "- 后端API: $BACKEND_URL"
echo "- Admin-V3: https://ai-pm-admin-v3-prod.vercel.app"
echo ""
echo "🎯 下一步操作："
echo "1. 访问 $DEPLOYMENT_URL 测试用户端功能"
echo "2. 尝试登录/注册功能验证API连接"
echo "3. 检查WebSocket实时通信是否正常"