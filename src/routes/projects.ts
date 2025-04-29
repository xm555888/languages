import { FastifyPluginAsync } from 'fastify';
import { ProjectService } from '../services/projectService';
import { ProjectDTO } from '../types';

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  const projectService = new ProjectService(fastify.prisma);

  // 获取所有项目
  fastify.get('/', async (request, reply) => {
    const projects = await projectService.getAllProjects();
    return reply.send({ data: projects });
  });

  // 获取单个项目
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = request.params.id;

    const project = await projectService.getProjectById(id);

    if (!project) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `项目ID ${id} 不存在`,
      });
    }

    return reply.send({ data: project });
  });

  // 创建项目
  fastify.post<{ Body: ProjectDTO }>('/', async (request, reply) => {
    const { name, description } = request.body;

    const project = await projectService.createProject({
      name,
      description,
    });

    return reply.status(201).send({ data: project });
  });

  // 更新项目
  fastify.put<{ Params: { id: string }; Body: ProjectDTO }>('/:id', async (request, reply) => {
    const id = request.params.id;
    const { name, description } = request.body;

    // 检查项目是否存在
    const existingProject = await projectService.getProjectById(id);

    if (!existingProject) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `项目ID ${id} 不存在`,
      });
    }

    const project = await projectService.updateProject(id, {
      name,
      description,
    });

    return reply.send({ data: project });
  });

  // 删除项目
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = request.params.id;

    // 检查项目是否存在
    const existingProject = await projectService.getProjectById(id);

    if (!existingProject) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `项目ID ${id} 不存在`,
      });
    }

    await projectService.deleteProject(id);

    return reply.status(204).send();
  });

  // 重新生成API密钥
  fastify.post<{ Params: { id: string } }>('/:id/regenerate-api-key', async (request, reply) => {
    const id = request.params.id;

    // 检查项目是否存在
    const existingProject = await projectService.getProjectById(id);

    if (!existingProject) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `项目ID ${id} 不存在`,
      });
    }

    const project = await projectService.regenerateApiKey(id);

    return reply.send({ data: project });
  });
};

export default projectRoutes;
