#!/bin/bash

echo "🚀 手动部署到Vercel"
echo "================================"

# 检查是否安装了vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm i -g vercel
fi

echo "📋 部署配置："
echo "  - 项目: ai-pm-user-frontend"
echo "  - 分支: main"
echo "  - 环境: production"

# 清理并重新构建
echo -e "\n🔨 本地构建..."
rm -rf dist
npm run build:vercel

if [ -d "dist" ]; then
    echo "✅ 构建成功，dist目录已创建"
    
    echo -e "\n📤 开始部署到Vercel..."
    # 使用vercel CLI部署
    # --prod: 部署到生产环境
    # --yes: 自动确认
    # --name: 项目名称
    vercel --prod --yes --name ai-pm-user-frontend
    
    echo -e "\n✅ 部署命令已执行"
    echo "请查看上方输出的URL访问部署的网站"
else
    echo "❌ 构建失败，dist目录未创建"
    exit 1
fi