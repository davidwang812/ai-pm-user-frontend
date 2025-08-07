#!/bin/bash

# 确保dist目录存在
echo "🔍 检查dist目录..."

if [ -d "dist" ]; then
  echo "✅ dist目录已存在"
  ls -la dist/
else
  echo "⚠️ dist目录不存在，创建中..."
  mkdir -p dist
  echo "✅ dist目录已创建"
fi

echo "📁 当前目录结构:"
ls -la