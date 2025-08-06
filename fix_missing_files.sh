#!/bin/bash

echo "🔧 修复所有缺失文件"
echo "===================="

# 1. 修复lodash-es导入问题
echo "📦 修复lodash-es导入..."
# lodash-es在package.json中缺失，但我们已经安装了lodash-es（在依赖分析中看到）
# 检查是否真的缺失
if ! grep -q "lodash-es" package.json; then
  echo "添加lodash-es到package.json..."
  # 使用sed在dependencies中添加lodash-es
  sed -i '/"dependencies": {/a\    "lodash-es": "^4.17.21",' package.json
fi

# 2. 创建缺失的图片文件
echo "🖼️ 创建占位图片..."
mkdir -p src/assets/images

# 创建logo.png的SVG占位符
cat > src/assets/images/logo.svg << 'EOF'
<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="40" fill="#667eea" rx="8"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">AI PM</text>
</svg>
EOF

# 转换SVG到PNG（使用base64编码的1x1透明PNG作为占位符）
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > src/assets/images/logo.png

# 创建Google SVG图标
cat > src/assets/images/google.svg << 'EOF'
<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
EOF

# 创建GitHub SVG图标
cat > src/assets/images/github.svg << 'EOF'
<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
  <path fill="#333" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
</svg>
EOF

# 创建支付宝PNG占位符
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > src/assets/images/alipay.png

# 创建微信支付PNG占位符
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > src/assets/images/wechat-pay.png

echo "✅ 所有缺失文件已创建！"
echo ""
echo "📋 已修复："
echo "  • lodash-es 依赖配置"
echo "  • logo.png (占位图)"
echo "  • google.svg"
echo "  • github.svg"
echo "  • alipay.png (占位图)"
echo "  • wechat-pay.png (占位图)"
echo ""
echo "💡 注意：PNG图片是占位符，请在后续替换为实际图片。"