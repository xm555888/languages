import { PrismaClient } from '@prisma/client';
import { LanguageDTO, LocaleDTO } from '../types';

export class LanguageService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 获取所有语言
  async getLanguagesByProjectId(projectId: string) {
    return this.prisma.locale.findMany({
      orderBy: {
        isDefault: 'desc',
      },
    });
  }

  // 获取单个语言
  async getLanguageById(id: string) {
    return this.prisma.locale.findFirst({
      where: {
        id,
      },
    });
  }

  // 获取语言通过代码
  async getLanguageByCode(code: string) {
    return this.prisma.locale.findFirst({
      where: {
        code,
      },
    });
  }

  // 创建语言
  async createLanguage(data: LocaleDTO) {
    // 如果设置为默认语言，则将其他语言设置为非默认
    if (data.isDefault) {
      await this.prisma.locale.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 如果是第一个语言，则自动设置为默认语言
    const languageCount = await this.prisma.locale.count();

    const isDefault = data.isDefault !== undefined ? data.isDefault : languageCount === 0;

    return this.prisma.locale.create({
      data: {
        code: data.code,
        name: data.name,
        nativeName: data.nativeName,
        isDefault,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  // 更新语言
  async updateLanguage(id: string, data: LocaleDTO) {
    // 如果设置为默认语言，则将其他语言设置为非默认
    if (data.isDefault) {
      await this.prisma.locale.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return this.prisma.locale.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        nativeName: data.nativeName,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    });
  }

  // 删除语言
  async deleteLanguage(id: string) {
    const language = await this.prisma.locale.findUnique({
      where: { id },
    });

    // 如果删除的是默认语言，则将第一个活跃语言设置为默认语言
    if (language?.isDefault) {
      const firstActiveLanguage = await this.prisma.locale.findFirst({
        where: {
          isActive: true,
          id: { not: id },
        },
      });

      if (firstActiveLanguage) {
        await this.prisma.locale.update({
          where: { id: firstActiveLanguage.id },
          data: { isDefault: true },
        });
      }
    }

    return this.prisma.locale.delete({
      where: { id },
    });
  }
}
