#!/bin/bash

echo "🧪 AI产品经理用户端功能测试"
echo "================================"
echo ""

FRONTEND_URL="https://ai-pm-user-frontend.vercel.app"
API_URL="$FRONTEND_URL/api"

# 测试数据
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="Test123456!"
TEST_USERNAME="testuser_$(date +%s)"

echo "📋 测试环境信息："
echo "- 前端URL: $FRONTEND_URL"
echo "- API基础URL: $API_URL"
echo "- 测试邮箱: $TEST_EMAIL"
echo ""

# 1. 测试注册功能
echo "1️⃣ 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/user/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"username\": \"$TEST_USERNAME\"
  }")

echo "注册响应："
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# 检查注册是否成功
if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 注册成功"
else
    echo "❌ 注册失败"
fi
echo ""

# 2. 测试登录功能
echo "2️⃣ 测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/user/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "登录响应："
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# 提取token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo "✅ 登录成功，获取到Token"
    echo "Token: ${TOKEN:0:20}..."
else
    echo "❌ 登录失败，未获取到Token"
    exit 1
fi
echo ""

# 3. 测试认证状态
echo "3️⃣ 测试认证状态..."
AUTH_CHECK=$(curl -s -X GET "$API_URL/user/auth/verify" \
  -H "Authorization: Bearer $TOKEN")

echo "认证验证响应："
echo "$AUTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$AUTH_CHECK"
echo ""

# 4. 测试用户信息获取
echo "4️⃣ 测试获取用户信息..."
USER_INFO=$(curl -s -X GET "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "用户信息："
echo "$USER_INFO" | python3 -m json.tool 2>/dev/null || echo "$USER_INFO"
echo ""

# 5. 测试Token使用情况
echo "5️⃣ 测试Token使用统计..."
TOKEN_USAGE=$(curl -s -X GET "$API_URL/user/token-usage" \
  -H "Authorization: Bearer $TOKEN")

echo "Token使用情况："
echo "$TOKEN_USAGE" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_USAGE"
echo ""

# 6. 测试产品列表
echo "6️⃣ 测试获取产品列表..."
PRODUCTS=$(curl -s -X GET "$API_URL/products" \
  -H "Authorization: Bearer $TOKEN")

echo "产品列表："
echo "$PRODUCTS" | python3 -m json.tool 2>/dev/null || echo "$PRODUCTS"
echo ""

# 7. 测试创建产品
echo "7️⃣ 测试创建新产品..."
CREATE_PRODUCT=$(curl -s -X POST "$API_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试产品",
    "description": "这是一个测试产品",
    "target_users": "测试用户",
    "core_features": "测试功能"
  }')

echo "创建产品响应："
echo "$CREATE_PRODUCT" | python3 -m json.tool 2>/dev/null || echo "$CREATE_PRODUCT"

# 提取产品ID
PRODUCT_ID=$(echo "$CREATE_PRODUCT" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -n "$PRODUCT_ID" ]; then
    echo "✅ 产品创建成功，ID: $PRODUCT_ID"
else
    echo "⚠️  产品创建可能失败"
fi
echo ""

# 8. 测试AI服务可用性
echo "8️⃣ 测试AI服务状态..."
AI_STATUS=$(curl -s -X GET "$API_URL/ai/status" \
  -H "Authorization: Bearer $TOKEN")

echo "AI服务状态："
echo "$AI_STATUS" | python3 -m json.tool 2>/dev/null || echo "$AI_STATUS"
echo ""

# 9. 测试简单的AI对话
echo "9️⃣ 测试AI对话功能..."
AI_CHAT=$(curl -s -X POST "$API_URL/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请简单介绍一下自己",
    "type": "question"
  }')

echo "AI对话响应："
echo "$AI_CHAT" | python3 -m json.tool 2>/dev/null || echo "$AI_CHAT"
echo ""

# 10. 测试订阅信息
echo "🔟 测试订阅信息..."
SUBSCRIPTION=$(curl -s -X GET "$API_URL/user/subscription" \
  -H "Authorization: Bearer $TOKEN")

echo "订阅信息："
echo "$SUBSCRIPTION" | python3 -m json.tool 2>/dev/null || echo "$SUBSCRIPTION"
echo ""

# 测试总结
echo "📊 测试总结"
echo "================================"
echo "✅ 已完成的测试："
echo "  - 用户注册"
echo "  - 用户登录" 
echo "  - Token认证"
echo "  - 用户信息获取"
echo "  - Token使用统计"
echo "  - 产品CRUD操作"
echo "  - AI服务状态"
echo "  - AI对话功能"
echo "  - 订阅信息"
echo ""
echo "🔗 相关链接："
echo "  - 用户端: $FRONTEND_URL"
echo "  - 登录页: $FRONTEND_URL/#/login"
echo "  - 注册页: $FRONTEND_URL/#/register"
echo ""
echo "📝 注意事项："
echo "  - 某些功能可能需要特定的订阅计划"
echo "  - WebSocket测试需要在浏览器中进行"
echo "  - 完整的UI测试建议手动在浏览器中验证"