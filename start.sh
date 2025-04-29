#!/bin/bash

# 检测运行环境
if [ "$DOCKER_CONTAINER" = "true" ]; then
  echo "检测到Docker容器环境"
  IS_DOCKER=true
else
  echo "检测到本地开发环境"
  IS_DOCKER=false

  # 本地环境检查
  if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
  fi

  if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请先安装npm"
    exit 1
  fi

  if ! command -v redis-cli &> /dev/null; then
    echo "警告: 未找到Redis，某些功能可能无法正常工作"
    echo "建议安装Redis以提高性能"
  fi
fi

# Docker环境特定操作
if [ "$IS_DOCKER" = true ]; then
  # 等待PostgreSQL启动
  echo "等待PostgreSQL启动..."
  sleep 10

  # 执行数据库迁移
  echo "执行数据库迁移..."
  npx prisma migrate deploy

  # 导入种子数据
  echo "导入种子数据..."
  npx prisma db seed

  # 启动生产服务
  echo "启动多语言服务(生产模式)..."
  exec node dist/server.js
else
  # 本地开发环境操作
  # 安装依赖
  echo "正在安装依赖..."
  npm install

  # 生成Prisma客户端
  echo "正在生成Prisma客户端..."
  npx prisma generate

  # 启动开发服务
  echo "正在启动多语言服务(开发模式)..."
  npm run dev
fi
