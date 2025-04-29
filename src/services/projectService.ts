import { PrismaClient } from '@prisma/client';
import { ProjectDTO } from '../types';
import crypto from 'crypto';

export class ProjectService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 生成API密钥
  private generateApiKey(): string {
    // 添加时间戳确保唯一性
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(`${timestamp}-${random}`).digest('hex');
  }

  // 获取所有项目
  async getAllProjects() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取单个项目
  async getProjectById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  // 获取项目通过API密钥
  async getProjectByApiKey(apiKey: string) {
    return this.prisma.project.findUnique({
      where: { apiKey },
    });
  }

  // 创建项目
  async createProject(data: ProjectDTO) {
    const apiKey = this.generateApiKey();

    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description || '',
        apiKey,
        isActive: true,
      },
    });
  }

  // 更新项目
  async updateProject(id: string, data: ProjectDTO) {
    // 先检查项目是否存在
    const existingProject = await this.prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return null;
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name || existingProject.name,
        description: data.description !== undefined ? data.description : existingProject.description,
        isActive: data.isActive !== undefined ? data.isActive : existingProject.isActive,
      },
    });
  }

  // 删除项目
  async deleteProject(id: string) {
    // 先检查项目是否存在
    const existingProject = await this.prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return null;
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  // 重新生成API密钥
  async regenerateApiKey(id: string) {
    const apiKey = this.generateApiKey();

    return this.prisma.project.update({
      where: { id },
      data: { apiKey },
    });
  }
}
