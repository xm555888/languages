import { PrismaClient } from '@prisma/client';
import { LocaleDTO } from '../types';

export class LocaleService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 获取所有语言
  async getAllLocales() {
    return this.prisma.locale.findMany({
      orderBy: {
        isDefault: 'desc',
      },
    });
  }

  // 获取单个语言
  async getLocaleById(id: string) {
    return this.prisma.locale.findUnique({
      where: { id },
    });
  }

  // 获取语言通过代码
  async getLocaleByCode(code: string) {
    return this.prisma.locale.findUnique({
      where: { code },
    });
  }

  // 创建语言
  async createLocale(data: LocaleDTO) {
    // 如果是第一个语言，则自动设置为默认语言
    const localeCount = await this.prisma.locale.count();
    const isDefault = data.isDefault !== undefined ? data.isDefault : localeCount === 0;

    // 如果设置为默认语言，则将其他语言设置为非默认
    if (isDefault) {
      await this.prisma.locale.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 创建新语言
    const newLocale = await this.prisma.locale.create({
      data: {
        code: data.code,
        name: data.name,
        nativeName: data.nativeName,
        isDefault,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return newLocale;
  }

  // 更新语言
  async updateLocale(id: string, data: LocaleDTO) {
    // 先检查语言是否存在
    const existingLocale = await this.prisma.locale.findUnique({
      where: { id }
    });

    if (!existingLocale) {
      return null;
    }

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
        code: data.code || existingLocale.code,
        name: data.name || existingLocale.name,
        nativeName: data.nativeName || existingLocale.nativeName,
        isDefault: data.isDefault !== undefined ? data.isDefault : existingLocale.isDefault,
        isActive: data.isActive !== undefined ? data.isActive : existingLocale.isActive,
      },
    });
  }

  // 删除语言
  async deleteLocale(id: string) {
    const locale = await this.prisma.locale.findUnique({
      where: { id },
    });

    // 如果删除的是默认语言，则将第一个活跃语言设置为默认语言
    if (locale?.isDefault) {
      const firstActiveLocale = await this.prisma.locale.findFirst({
        where: {
          isActive: true,
          id: { not: id },
        },
      });

      if (firstActiveLocale) {
        await this.prisma.locale.update({
          where: { id: firstActiveLocale.id },
          data: { isDefault: true },
        });
      }
    }

    return this.prisma.locale.delete({
      where: { id },
    });
  }
}
