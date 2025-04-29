import { FastifyPluginAsync } from 'fastify';
import { LanguageService } from '../services/languageService';
import { LanguageDTO, LocaleDTO } from '../types';

const languageRoutes: FastifyPluginAsync = async (fastify) => {
  const languageService = new LanguageService(fastify.prisma);

  // 获取项目的所有语言
  fastify.get<{ Params: { projectId: string } }>('/:projectId/languages', async (request, reply) => {
    const projectId = request.params.projectId;

    const languages = await languageService.getLanguagesByProjectId(projectId);

    return reply.send({ data: languages });
  });

  // 获取单个语言
  fastify.get<{ Params: { projectId: string; id: string } }>('/:projectId/languages/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    const language = await languageService.getLanguageById(id);

    if (!language) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言ID ${id} 不存在`,
      });
    }

    return reply.send({ data: language });
  });

  // 创建语言
  fastify.post<{ Params: { projectId: string }; Body: LocaleDTO }>('/:projectId/languages', async (request, reply) => {
    const projectId = request.params.projectId;
    const { code, name, nativeName, isDefault, isActive } = request.body as LocaleDTO;

    // 检查语言代码是否已存在
    const existingLanguage = await languageService.getLanguageByCode(code);

    if (existingLanguage) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `语言代码 ${code} 已存在`,
      });
    }

    const language = await languageService.createLanguage({
      code,
      name,
      nativeName,
      isDefault,
      isActive,
      projectId,
    });

    return reply.status(201).send({ data: language });
  });

  // 更新语言
  fastify.put<{ Params: { projectId: string; id: string }; Body: LocaleDTO }>('/:projectId/languages/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;
    const { code, name, nativeName, isDefault, isActive } = request.body as LocaleDTO;

    // 检查语言是否存在
    const existingLanguage = await languageService.getLanguageById(id);

    if (!existingLanguage) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言ID ${id} 不存在`,
      });
    }

    // 检查语言代码是否已被其他语言使用
    if (code !== existingLanguage.code) {
      const languageWithSameCode = await languageService.getLanguageByCode(code);

      if (languageWithSameCode && languageWithSameCode.id !== id) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: `语言代码 ${code} 已被其他语言使用`,
        });
      }
    }

    const language = await languageService.updateLanguage(id, {
      code,
      name,
      nativeName,
      isDefault,
      isActive,
      projectId,
    });

    return reply.send({ data: language });
  });

  // 删除语言
  fastify.delete<{ Params: { projectId: string; id: string } }>('/:projectId/languages/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    // 检查语言是否存在
    const existingLanguage = await languageService.getLanguageById(id);

    if (!existingLanguage) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言ID ${id} 不存在`,
      });
    }

    await languageService.deleteLanguage(id);

    return reply.status(204).send();
  });
};

export default languageRoutes;
