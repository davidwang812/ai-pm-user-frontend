# Vercel部署问题排查指南

## 症状
- Git push成功但Vercel没有更新
- 网站显示旧版本（index-Q0X6yF6G.js）
- 本地构建成功（index-NmoU9WMm.js）

## 可能的原因和解决方案

### 1. Vercel构建失败但部署了缓存版本
**检查方法**：
- 登录 https://vercel.com
- 查看项目构建日志
- 查找错误信息

**常见错误**：
```
Error: Cannot find module 'vite'
Error: vite: command not found
Error: No Output Directory named "dist" found
```

### 2. GitHub集成断开
**检查方法**：
- Vercel项目设置 > Git
- 确认连接到 davidwang812/ai-pm-user-frontend
- 确认Production Branch是main

**修复方法**：
- 重新连接GitHub仓库
- 或手动部署：`npx vercel --prod`

### 3. 构建命令问题
**当前配置**：
```json
"buildCommand": "npm run build:vercel"
"build:vercel": "node node_modules/vite/bin/vite.js build"
```

**备选方案**：
```json
// 方案A：直接使用vite
"buildCommand": "npx vite build"

// 方案B：确保依赖安装
"buildCommand": "npm ci && npx vite build"

// 方案C：调试模式
"buildCommand": "ls -la node_modules/.bin && npx vite build"
```

### 4. Node版本问题
**解决**：
在vercel.json添加：
```json
{
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

## 手动部署方法

如果自动部署持续失败，可以手动部署：

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 手动部署
vercel --prod

# 或指定构建命令
vercel --prod --build-env NODE_ENV=production
```

## 验证部署成功的方法

```bash
# 1. 检查版本哈希
curl -s https://ai-pm-user-frontend.vercel.app | grep -o "index-[^.]*\.js"

# 2. 对比本地版本
cat dist/index.html | grep -o "index-[^.]*\.js"

# 3. 检查API配置
curl -s https://ai-pm-user-frontend.vercel.app/js/index-*.js | grep -o "aiproductmanager"
```

## 建议的下一步

1. **查看Vercel构建日志**
   - 找出具体的构建错误
   - 根据错误信息调整配置

2. **尝试手动部署**
   - 使用Vercel CLI测试部署
   - 确认本地能成功部署

3. **简化构建流程**
   - 移除不必要的构建步骤
   - 使用最简单的构建命令

4. **检查环境变量**
   - 确认Vercel项目中设置了正确的环境变量
   - VITE_API_BASE_URL
   - VITE_WS_URL