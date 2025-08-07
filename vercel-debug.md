# Vercel部署问题诊断

## 问题现象
- 本地构建成功，生成了`dist`目录
- Git push后Vercel自动部署
- Vercel报错：No Output Directory named "dist" found

## 原因分析

### 1. 本地 vs Vercel环境差异
- **本地**: 我们手动运行了`node node_modules/vite/bin/vite.js build`
- **Vercel**: 运行`npm run build`，但可能遇到了之前的"2"参数问题

### 2. 构建命令问题
原package.json中的build脚本：
```json
"build": "vite build"
```
但npm可能传递了额外参数导致`vite build 2`

### 3. 可能的原因
- npm版本差异（本地11.x，Vercel可能是其他版本）
- 环境变量差异
- Node.js版本差异

## 解决方案

### 方案A：使用npx确保正确执行
修改package.json的build命令为：
```json
"build": "npx vite build"
```

### 方案B：使用node直接执行
```json
"build": "node node_modules/vite/bin/vite.js build"
```

### 方案C：创建专门的Vercel构建脚本
```json
"build:vercel": "node --version && npm --version && npx vite build"
```