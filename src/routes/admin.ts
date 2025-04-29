import { FastifyPluginAsync } from 'fastify';
import { ProjectService } from '../services/projectService';
import { LocaleService } from '../services/localeService';
import { NamespaceService } from '../services/namespaceService';
import { TranslationService } from '../services/translationService';
import { ProjectDTO, LocaleDTO, NamespaceDTO, TranslationRequest } from '../types';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const projectService = new ProjectService(fastify.prisma);
  const localeService = new LocaleService(fastify.prisma);
  const namespaceService = new NamespaceService(fastify.prisma);
  const translationService = new TranslationService(fastify.prisma, fastify.redis);

  // 项目API
  // 获取所有项目
  fastify.get('/projects', async (request, reply) => {
    const projects = await projectService.getAllProjects();
    return { data: projects };
  });

  // 获取单个项目
  fastify.get<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = request.params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `项目 ${id} 不存在`,
      });
    }

    return { data: project };
  });

  // 创建项目
  fastify.post<{ Body: ProjectDTO }>('/projects', async (request, reply) => {
    const project = await projectService.createProject(request.body);
    return reply.status(201).send({ data: project });
  });

  // 更新项目
  fastify.put<{ Params: { id: string }; Body: ProjectDTO }>('/projects/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      // 先检查项目是否存在
      const existingProject = await projectService.getProjectById(id);

      if (!existingProject) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `项目 ${id} 不存在`,
        });
      }

      const project = await projectService.updateProject(id, request.body);
      return { data: project };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });

  // 删除项目
  fastify.delete<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      // 先检查项目是否存在
      const existingProject = await projectService.getProjectById(id);

      if (!existingProject) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `项目 ${id} 不存在`,
        });
      }

      const project = await projectService.deleteProject(id);
      return { data: project };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });

  // 语言API
  // 获取所有语言
  fastify.get('/locales', async (request, reply) => {
    const locales = await localeService.getAllLocales();
    return { data: locales };
  });

  // 获取单个语言
  fastify.get<{ Params: { id: string } }>('/locales/:id', async (request, reply) => {
    const { id } = request.params;
    const locale = await localeService.getLocaleById(id);

    if (!locale) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言 ${id} 不存在`,
      });
    }

    return { data: locale };
  });

  // 创建语言
  fastify.post<{ Body: LocaleDTO }>('/locales', async (request, reply) => {
    const locale = await localeService.createLocale(request.body);
    return reply.status(201).send({ data: locale });
  });

  // 更新语言
  fastify.put<{ Params: { id: string }; Body: LocaleDTO }>('/locales/:id', async (request, reply) => {
    const { id } = request.params;
    const locale = await localeService.updateLocale(id, request.body);

    if (!locale) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言 ${id} 不存在`,
      });
    }

    return { data: locale };
  });

  // 删除语言
  fastify.delete<{ Params: { id: string } }>('/locales/:id', async (request, reply) => {
    const { id } = request.params;
    const locale = await localeService.deleteLocale(id);

    if (!locale) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `语言 ${id} 不存在`,
      });
    }

    return { data: locale };
  });

  // 命名空间API
  // 获取项目的所有命名空间
  fastify.get<{ Params: { projectId: string } }>('/:projectId/namespaces', async (request, reply) => {
    const { projectId } = request.params;
    const namespaces = await namespaceService.getNamespacesByProjectId(projectId);
    return { data: namespaces };
  });

  // 获取单个命名空间
  fastify.get<{ Params: { projectId: string; id: string } }>('/:projectId/namespaces/:id', async (request, reply) => {
    const { projectId, id } = request.params;
    const namespace = await namespaceService.getNamespaceById(id, projectId);

    if (!namespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间 ${id} 不存在`,
      });
    }

    return { data: namespace };
  });

  // 创建命名空间
  fastify.post<{ Params: { projectId: string }; Body: NamespaceDTO }>('/:projectId/namespaces', async (request, reply) => {
    const { projectId } = request.params;
    const namespace = await namespaceService.createNamespace({
      ...request.body,
      projectId,
    });
    return reply.status(201).send({ data: namespace });
  });

  // 更新命名空间
  fastify.put<{ Params: { projectId: string; id: string }; Body: NamespaceDTO }>('/:projectId/namespaces/:id', async (request, reply) => {
    const { projectId, id } = request.params;
    const namespace = await namespaceService.updateNamespace(id, request.body);

    if (!namespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间 ${id} 不存在`,
      });
    }

    return { data: namespace };
  });

  // 删除命名空间
  fastify.delete<{ Params: { projectId: string; id: string } }>('/:projectId/namespaces/:id', async (request, reply) => {
    const { id } = request.params;
    const namespace = await namespaceService.deleteNamespace(id);

    if (!namespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间 ${id} 不存在`,
      });
    }

    return { data: namespace };
  });

  // 翻译API
  // 批量创建或更新翻译
  fastify.post<{ Params: { projectId: string }; Body: { translations: TranslationRequest[] } }>('/:projectId/translations/batch', async (request, reply) => {
    const { projectId } = request.params;
    const { translations } = request.body;

    try {
      const results = await translationService.upsertTranslations(projectId, translations);
      return reply.status(201).send({ data: results });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
      });
    }
  });
};

export default adminRoutes;
