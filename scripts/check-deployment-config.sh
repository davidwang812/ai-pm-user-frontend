#\!/bin/bash

echo "🔍 部署配置健康检查"
echo "========================="

ERRORS=0

# 检查根目录是否误放vercel.json
echo -n "检查根目录配置... "
if [ -f "./vercel.json" ]; then
  echo "❌ 错误"
  echo "  根目录不应有vercel.json（这是后端项目）"
  ((ERRORS++))
else
  echo "✅ 正常"
fi

# 检查前端目录配置
echo -n "检查前端目录配置... "
if [ -d "./user-frontend-deploy" ]; then
  if [ \! -f "./user-frontend-deploy/vercel.json" ]; then
    echo "⚠️ 警告: 前端目录缺少vercel.json"
  else
    echo "✅ 正常"
  fi
fi

echo "========================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ 所有检查通过！"
  exit 0
else
  echo "发现 $ERRORS 个错误"
  exit 1
fi
