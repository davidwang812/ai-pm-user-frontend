#!/bin/bash

echo "🔍 测试前后端API连接..."
echo ""

FRONTEND_URL="https://ai-pm-user-frontend.vercel.app"
BACKEND_URL="https://aiproductmanager-production.up.railway.app"

# 测试后端健康检查
echo "1. 测试后端健康检查..."
curl -s "$BACKEND_URL/health" | python3 -m json.tool || echo "❌ 后端健康检查失败"

echo ""
echo "2. 测试前端代理配置..."
# 通过前端URL测试API代理
curl -s "$FRONTEND_URL/api/health" | python3 -m json.tool || echo "❌ 前端API代理可能未配置正确"

echo ""
echo "3. 测试用户认证API..."
# 测试登录接口（预期失败，但应返回正确的错误格式）
curl -s -X POST "$FRONTEND_URL/api/user/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | python3 -m json.tool || echo "❌ API连接失败"

echo ""
echo "4. 测试CORS配置..."
curl -s -I "$FRONTEND_URL/api/health" | grep -i "access-control" || echo "⚠️  未找到CORS头"

echo ""
echo "📋 测试总结："
echo "- 前端URL: $FRONTEND_URL"
echo "- 后端API: $BACKEND_URL"
echo "- API代理路径: /api/* → $BACKEND_URL/api/*"
echo ""
echo "🎯 如果API代理未生效："
echo "1. 检查Vercel部署日志"
echo "2. 确认vercel.json的rewrites配置"
echo "3. 验证后端CORS设置"