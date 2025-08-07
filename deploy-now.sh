#!/bin/bash

echo "🚀 快速部署到Vercel (使用npx)"
echo "================================"

# 1. 构建项目
echo "🔨 构建项目..."
npm run build:vercel

# 2. 检查dist目录
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist目录不存在"
    exit 1
fi

echo "✅ 构建成功"

# 3. 使用npx部署（无需安装vercel）
echo -e "\n📤 部署到Vercel..."
echo "如果要求登录，请按提示操作"

npx vercel --prod

echo -e "\n✅ 部署完成！"