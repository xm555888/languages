import { FastifyPluginAsync } from 'fastify';
import { NamespaceService } from '../services/namespaceService';
import { NamespaceDTO } from '../types';

const namespaceRoutes: FastifyPluginAsync = async (fastify) => {
  const namespaceService = new NamespaceService(fastify.prisma);

  // 获取项目的所有命名空间
  fastify.get<{ Params: { projectId: string } }>('/:projectId/namespaces', async (request, reply) => {
    const projectId = request.params.projectId;

    const namespaces = await namespaceService.getNamespacesByProjectId(projectId);

    return reply.send({ data: namespaces });
  });

  // 获取单个命名空间
  fastify.get<{ Params: { projectId: string; id: string } }>('/:projectId/namespaces/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    const namespace = await namespaceService.getNamespaceById(id, projectId);

    if (!namespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间ID ${id} 不存在`,
      });
    }

    return reply.send({ data: namespace });
  });

  // 创建命名空间
  fastify.post<{ Params: { projectId: string }; Body: NamespaceDTO }>('/:projectId/namespaces', async (request, reply) => {
    const projectId = request.params.projectId;
    const { name, description } = request.body;

    // 检查命名空间名称是否已存在
    const existingNamespace = await namespaceService.getNamespaceByName(name, projectId);

    if (existingNamespace) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `命名空间名称 ${name} 已存在`,
      });
    }

    const namespace = await namespaceService.createNamespace({
      name,
      description,
      projectId,
    });

    return reply.status(201).send({ data: namespace });
  });

  // 更新命名空间
  fastify.put<{ Params: { projectId: string; id: string }; Body: NamespaceDTO }>('/:projectId/namespaces/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;
    const { name, description } = request.body;

    // 检查命名空间是否存在
    const existingNamespace = await namespaceService.getNamespaceById(id, projectId);

    if (!existingNamespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间ID ${id} 不存在`,
      });
    }

    // 检查命名空间名称是否已被其他命名空间使用
    if (name !== existingNamespace.name) {
      const namespaceWithSameName = await namespaceService.getNamespaceByName(name, projectId);

      if (namespaceWithSameName && namespaceWithSameName.id !== id) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: `命名空间名称 ${name} 已被其他命名空间使用`,
        });
      }
    }

    const namespace = await namespaceService.updateNamespace(id, {
      name,
      description,
      projectId,
    });

    return reply.send({ data: namespace });
  });

  // 删除命名空间
  fastify.delete<{ Params: { projectId: string; id: string } }>('/:projectId/namespaces/:id', async (request, reply) => {
    const projectId = request.params.projectId;
    const id = request.params.id;

    // 检查命名空间是否存在
    const existingNamespace = await namespaceService.getNamespaceById(id, projectId);

    if (!existingNamespace) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `命名空间ID ${id} 不存在`,
      });
    }

    await namespaceService.deleteNamespace(id);

    return reply.status(204).send();
  });
};

export default namespaceRoutes;
