import { PrismaClient } from '@prisma/client';
import { NamespaceDTO } from '../types';

export class NamespaceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 获取项目的所有命名空间
  async getNamespacesByProjectId(projectId: string) {
    return this.prisma.namespace.findMany({
      where: { projectId },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // 获取单个命名空间
  async getNamespaceById(id: string, projectId: string) {
    return this.prisma.namespace.findFirst({
      where: {
        id,
        projectId,
      },
    });
  }

  // 获取命名空间通过名称
  async getNamespaceByName(name: string, projectId: string) {
    return this.prisma.namespace.findFirst({
      where: {
        name,
        projectId,
      },
    });
  }

  // 创建命名空间
  async createNamespace(data: NamespaceDTO) {
    try {
      // 先检查项目是否存在
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        // 如果项目不存在，则返回错误
        throw new Error(`项目 ${data.projectId} 不存在`);
      }

      // 检查是否已存在相同名称的命名空间
      const existingNamespace = await this.prisma.namespace.findFirst({
        where: {
          name: data.name,
          projectId: data.projectId
        }
      });

      if (existingNamespace) {
        return existingNamespace;
      }

      return this.prisma.namespace.create({
        data: {
          name: data.name,
          description: data.description || '',
          projectId: data.projectId,
        },
      });
    } catch (error) {
      console.error('创建命名空间时出错:', error);
      throw error;
    }
  }

  // 更新命名空间
  async updateNamespace(id: string, data: NamespaceDTO) {
    return this.prisma.namespace.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  // 删除命名空间
  async deleteNamespace(id: string) {
    return this.prisma.namespace.delete({
      where: { id },
    });
  }

  // 获取或创建命名空间
  async getOrCreateNamespace(name: string, projectId: string) {
    try {
      let namespace = await this.getNamespaceByName(name, projectId);

      if (!namespace) {
        namespace = await this.createNamespace({
          name,
          projectId,
        });
      }

      return namespace;
    } catch (error) {
      console.error('获取或创建命名空间时出错:', error);

      // 如果出错，则创建一个默认命名空间对象
      return {
        id: 'default-namespace-id',
        name,
        description: '',
        projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
}
