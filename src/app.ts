import Fastify, { FastifyInstance } from 'fastify';
import { SERVER, LOGGING } from './config';

// 导入插件
import dbPlugin from './plugins/db';
import redisPlugin from './plugins/redis';
import corsPlugin from './plugins/cors';

// 导入路由
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';

// 创建Fastify实例
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: LOGGING.LEVEL,
      transport: SERVER.IS_DEVELOPMENT
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // 注册插件
  app.register(corsPlugin);
  app.register(dbPlugin);
  app.register(redisPlugin);

  // 注册路由
  app.register(publicRoutes, { prefix: '/api/v1' });
  app.register(adminRoutes, { prefix: '/api/v1' });

  // 健康检查路由
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // 404处理
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  // 错误处理
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message || '服务器内部错误',
    });
  });

  return app;
}

export default buildApp;
