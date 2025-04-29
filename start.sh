#!/bin/bash

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查是否安装了npm
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查是否安装了Redis
if ! command -v redis-cli &> /dev/null; then
    echo "警告: 未找到Redis，某些功能可能无法正常工作"
    echo "建议安装Redis以提高性能"
fi

# 安装依赖
echo "正在安装依赖..."
npm install

# 生成Prisma客户端
echo "正在生成Prisma客户端..."
npx prisma generate

# 启动服务
echo "正在启动多语言服务..."
npm run dev
