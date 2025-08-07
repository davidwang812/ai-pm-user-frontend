#\!/bin/bash
# 统一的安全部署脚本

echo "🔍 运行部署前检查..."

# 强制运行检查
bash scripts/check-deployment-config.sh
if [ $? -ne 0 ]; then
  echo "❌ 部署检查失败！请修复问题后重试"
  exit 1
fi

echo "✅ 所有检查通过"

# 根据参数决定部署目标
case "$1" in
  backend)
    echo "部署后端到Railway..."
    git add -A && git commit -m "deploy: Backend update" && git push origin main
    ;;
  frontend)
    echo "部署前端到Vercel..."
    cd user-frontend-deploy && npm run build && npx vercel --prod --yes
    ;;
  *)
    echo "用法: $0 [backend|frontend]"
    exit 1
    ;;
esac
