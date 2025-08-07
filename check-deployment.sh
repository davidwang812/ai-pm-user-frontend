#!/bin/bash

echo "🔍 监控Vercel部署状态..."
echo "================================"

# 等待一会儿让部署开始
sleep 30

# 检查网站是否可访问
for i in {1..10}; do
  echo -e "\n尝试 #$i ($(date '+%H:%M:%S'))"
  
  # 检查HTTP状态
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ai-pm-user-frontend.vercel.app)
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ 网站可访问 (HTTP $STATUS)"
    
    # 检查是否是新版本（通过检查页面内容）
    CONTENT=$(curl -s https://ai-pm-user-frontend.vercel.app)
    
    # 检查是否包含新的构建资源
    if echo "$CONTENT" | grep -q "index-"; then
      echo "✅ 部署成功！新版本已上线"
      
      # 测试注册页面
      echo -e "\n📍 测试注册页面..."
      REG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ai-pm-user-frontend.vercel.app/register)
      echo "注册页面状态: HTTP $REG_STATUS"
      
      # 测试API连接
      echo -e "\n📍 测试API连接..."
      API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aiproductmanager-production.up.railway.app/health)
      echo "API健康检查: HTTP $API_STATUS"
      
      exit 0
    else
      echo "⏳ 旧版本仍在运行，等待新部署..."
    fi
  else
    echo "⏳ 网站不可访问 (HTTP $STATUS)，可能正在部署..."
  fi
  
  # 等待30秒再试
  sleep 30
done

echo -e "\n❌ 部署超时，请检查Vercel控制台"
exit 1