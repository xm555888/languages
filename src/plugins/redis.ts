import Redis from 'ioredis';
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { REDIS } from '../config';
import fs from 'fs';

// 声明Fastify实例的类型扩展
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

// 创建Redis客户端插件
const redisPlugin: FastifyPluginAsync = async (fastify) => {
  console.log('初始化Redis客户端...');

  // 检测当前运行环境
  const isContainer = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

  // 根据环境调整Redis连接配置
  if (isContainer) {
    console.log('检测到容器环境，使用容器网络Redis连接');
  }

  console.log('Redis URL:', REDIS.URL);
  console.log('Redis前缀:', REDIS.PREFIX);

  // 创建Redis客户端
  const redis = new Redis(REDIS.URL, {
    password: REDIS.PASSWORD || undefined,
    keyPrefix: REDIS.PREFIX,
  });

  // 测试连接
  try {
    await redis.ping();
    fastify.log.info('Redis连接成功');
  } catch (err) {
    fastify.log.error('Redis连接失败', err);
    throw err;
  }

  // 将Redis客户端添加到Fastify实例
  fastify.decorate('redis', redis);

  // 在服务器关闭时断开Redis连接
  fastify.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
};

export default fp(redisPlugin, { name: 'redis' });
