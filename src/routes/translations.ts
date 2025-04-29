import { FastifyPluginAsync } from 'fastify';
import { TranslationService } from '../services/translationService';
import { TranslationDTO, TranslationRequest } from '../types';

const translationRoutes: FastifyPluginAsync = async (fastify) => {
  const translationService = new TranslationService(fastify.prisma, fastify.redis);

  // 获取项目的所有翻译
  fastify.get<{ Params: { projectId: string } }>('/:projectId/translations', async (request, reply) => {
    const projectId = request.params.projectId;

    // 注意：这里应该使用 getTranslationsForProject 方法
    const translations = await translationService.getTranslationsForProject(projectId, '*');

    return reply.send({ data: translations });
  });

  // 获取项目特定语言的翻译
  fastify.get<{ Params: { projectId: string; locale: string } }>('/translations/:projectId/:locale', async (request, reply) => {
    const { projectId, locale } = request.params;

    const translations = await translationService.getTranslationsForProject(projectId, locale);

    return reply.send(translations);
  });

  // 获取项目特定语言和命名空间的翻译
  fastify.get<{ Params: { projectId: string; locale: string; namespace: string } }>('/translations/:projectId/:locale/:namespace', async (request, reply) => {
    const { projectId, locale, namespace } = request.params;

    const translations = await translationService.getTranslationsForProject(projectId, locale, namespace);

    return reply.send(translations);
  });

  // 获取单个翻译
  fastify.get<{ Params: { projectId: string; id: string } }>('/:projectId/translations/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    const translation = await translationService.getTranslationById(id);

    if (!translation) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `翻译ID ${id} 不存在`,
      });
    }

    return reply.send({ data: translation });
  });

  // 创建翻译
  fastify.post<{ Params: { projectId: string }; Body: TranslationDTO }>('/:projectId/translations', async (request, reply) => {
    const projectId = request.params.projectId;
    const { key, value, locale, namespaceId } = request.body;

    // 检查翻译键是否已存在
    const existingTranslation = await translationService.getTranslation(
      key,
      locale,
      namespaceId
    );

    if (existingTranslation) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `翻译键 ${key} 已存在于该语言和命名空间中`,
      });
    }

    const translation = await translationService.createTranslation({
      key,
      value,
      locale,
      namespaceId,
      description: request.body.description
    });

    return reply.status(201).send({ data: translation });
  });

  // 更新翻译
  fastify.put<{ Params: { projectId: string; id: string }; Body: TranslationDTO }>('/:projectId/translations/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;
    const { value, locale, namespaceId } = request.body;

    // 检查翻译是否存在
    const existingTranslation = await translationService.getTranslationById(id);

    if (!existingTranslation) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `翻译ID ${id} 不存在`,
      });
    }

    const translation = await translationService.updateTranslation(id, {
      key: existingTranslation.key,
      value,
      locale: locale || existingTranslation.locale,
      namespaceId: namespaceId || existingTranslation.namespaceId,
      description: request.body.description || existingTranslation.description || ''
    });

    return reply.send({ data: translation });
  });

  // 删除翻译
  fastify.delete<{ Params: { projectId: string; id: string } }>('/:projectId/translations/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    // 检查翻译是否存在
    const existingTranslation = await translationService.getTranslationById(id);

    if (!existingTranslation) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `翻译ID ${id} 不存在`,
      });
    }

    await translationService.deleteTranslation(id);

    return reply.status(204).send();
  });

  // 批量创建或更新翻译
  fastify.post<{ Params: { projectId: string }; Body: { translations: TranslationRequest[] } }>('/:projectId/translations/batch', async (request, reply) => {
    const projectId = request.params.projectId;
    const { translations } = request.body;

    const results = await translationService.upsertTranslations(projectId, translations);

    return reply.status(201).send({ data: results });
  });
};

export default translationRoutes;
