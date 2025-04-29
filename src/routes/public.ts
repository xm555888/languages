import { FastifyPluginAsync } from 'fastify';
import { ProjectService } from '../services/projectService';
import { TranslationService } from '../services/translationService';

const publicRoutes: FastifyPluginAsync = async (fastify) => {
  const projectService = new ProjectService(fastify.prisma);
  const translationService = new TranslationService(fastify.prisma, fastify.redis);

  // 获取项目的所有翻译 - 无需API密钥
  fastify.get<{ Params: { projectId: string; locale: string } }>('/translations/:projectId/:locale', async (request, reply) => {
    const { projectId, locale } = request.params;

    try {
      // 直接获取翻译，不验证API密钥
      const translations = await translationService.getTranslationsForProject(
        projectId,
        locale
      );

      // 设置CORS头，允许所有来源
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET');

      return reply.send(translations);
    } catch (error: any) {
      fastify.log.error(error);

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });

  // 获取项目特定命名空间的翻译 - 无需API密钥
  fastify.get<{ Params: { projectId: string; locale: string; namespace: string } }>('/translations/:projectId/:locale/:namespace', async (request, reply) => {
    const { projectId, locale, namespace } = request.params;

    try {
      // 直接获取翻译，不验证API密钥
      const translations = await translationService.getTranslationsForProject(
        projectId,
        locale,
        namespace
      );

      // 设置CORS头，允许所有来源
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET');

      return reply.send(translations);
    } catch (error: any) {
      fastify.log.error(error);

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });

  // 清除所有翻译缓存 - 仅在开发环境下可用
  fastify.get('/clear-cache', async (request, reply) => {
    try {
      // 检查是否在开发环境
      if (process.env.LANGUAGES_NODE_ENV !== 'development') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: '此操作仅在开发环境下可用',
        });
      }

      // 清除所有缓存
      const result = await translationService.clearAllCache();

      // 设置CORS头，允许所有来源
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET');

      return reply.send({
        success: result,
        message: result ? '缓存已清除' : '清除缓存失败',
      });
    } catch (error: any) {
      fastify.log.error(error);

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });

  // 预检请求处理
  fastify.options('*', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    reply.send();
  });
};

export default publicRoutes;
