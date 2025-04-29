import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fs from 'fs';

// 声明Fastify实例的类型扩展
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// 创建Prisma客户端插件
const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  console.log('初始化Prisma客户端...');
  console.log('数据库URL:', process.env.DATABASE_URL);

  // 检测当前运行环境
  const isContainer = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

  // 根据环境选择合适的默认数据库URL
  let defaultDbUrl = 'postgresql://postgres:123456789@localhost:5432/language_service?schema=public';

  if (isContainer) {
    // 容器环境下，使用服务名而非localhost
    defaultDbUrl = 'postgresql://postgres:123456789@postgres:5432/languages?schema=public';
    console.log('检测到容器环境，使用容器网络数据库URL');
  }

  // 使用专用的环境变量中的数据库URL
  const dbUrl = process.env.LANGUAGE_DATABASE_URL || process.env.DATABASE_URL || defaultDbUrl;

  // 确保LANGUAGE_DATABASE_URL环境变量被设置，因为Prisma直接使用它
  if (!process.env.LANGUAGE_DATABASE_URL) {
    process.env.LANGUAGE_DATABASE_URL = dbUrl;
    console.log('已设置LANGUAGE_DATABASE_URL环境变量');
  }

  console.log('使用数据库URL:', dbUrl);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // 连接数据库
    console.log('连接数据库...');
    await prisma.$connect();
    console.log('数据库连接成功!');

    // 测试查询
    console.log('测试数据库查询...');
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`;
    console.log('数据库表:', tables);
  } catch (error) {
    console.error('数据库连接或查询失败:', error);
    throw error;
  }

  // 将Prisma客户端添加到Fastify实例
  fastify.decorate('prisma', prisma);

  // 在服务器关闭时断开数据库连接
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, { name: 'prisma' });
