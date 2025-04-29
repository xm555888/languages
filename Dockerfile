# 构建阶段
FROM node:18-alpine AS builder

# 安装Prisma所需的依赖
RUN apk add --no-cache openssl

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 运行阶段
FROM node:18-alpine

# 安装Prisma所需的依赖
RUN apk add --no-cache openssl

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --omit=dev

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/src/db/schema.prisma ./src/db/schema.prisma

# 设置环境变量
ENV LANGUAGES_NODE_ENV=production
ENV LANGUAGES_PORT=3100
ENV LANGUAGES_HOST=0.0.0.0
ENV DOCKER_CONTAINER=true

# 暴露端口
EXPOSE 3100

# 启动应用
CMD ["node", "dist/server.js"]
