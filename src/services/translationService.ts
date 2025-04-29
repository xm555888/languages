import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { TranslationDTO, TranslationRequest, TranslationResponse } from '../types';
import { LocaleService } from './localeService';
import { NamespaceService } from './namespaceService';
import { REDIS } from '../config';
import crypto from 'crypto';

export class TranslationService {
  private prisma: PrismaClient;
  private redis: Redis;
  private localeService: LocaleService;
  private namespaceService: NamespaceService;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.localeService = new LocaleService(prisma);
    this.namespaceService = new NamespaceService(prisma);
  }

  // 获取命名空间的所有翻译
  async getTranslationsByNamespaceId(namespaceId: string) {
    return this.prisma.translation.findMany({
      where: { namespaceId },
      include: {
        namespace: true,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }

  // 获取单个翻译
  async getTranslationById(id: string) {
    return this.prisma.translation.findUnique({
      where: { id },
      include: {
        namespace: true,
      },
    });
  }

  // 获取翻译通过键、语言和命名空间
  async getTranslation(key: string, locale: string, namespaceId: string) {
    return this.prisma.translation.findFirst({
      where: {
        key,
        locale: locale,
        namespaceId,
      },
    });
  }

  // 创建翻译
  async createTranslation(data: TranslationDTO) {
    try {
      // 检查命名空间是否存在
      const namespace = await this.prisma.namespace.findUnique({
        where: { id: data.namespaceId },
      });

      if (!namespace) {
        // 如果命名空间不存在，则创建一个新的
        const project = await this.prisma.project.findFirst();
        if (!project) {
          throw new Error('没有可用的项目');
        }

        const newNamespace = await this.namespaceService.createNamespace({
          name: 'common',
          description: '自动创建的命名空间',
          projectId: project.id
        });

        data.namespaceId = newNamespace.id;
      }

      // 检查语言是否存在
      const locale = await this.localeService.getLocaleByCode(data.locale);

      if (!locale) {
        // 如果语言不存在，则创建一个新的
        await this.localeService.createLocale({
          code: data.locale,
          name: data.locale,
          nativeName: data.locale
        });
      }

      // 生成唯一ID
      const id = data.id || crypto.randomUUID();

      const translation = await this.prisma.translation.create({
        data: {
          id,
          key: data.key,
          value: data.value,
          locale: data.locale,
          description: data.description || '',
          namespaceId: data.namespaceId,
        },
      });

      // 使缓存失效
      await this.invalidateCache(data.locale, data.namespaceId);

      return translation;
    } catch (error) {
      console.error('createTranslation error:', error);
      throw error;
    }
  }

  // 更新翻译
  async updateTranslation(id: string, data: TranslationDTO) {
    const translation = await this.prisma.translation.update({
      where: { id },
      data: {
        value: data.value,
        description: data.description,
      },
    });

    // 使缓存失效
    await this.invalidateCache(data.locale, data.namespaceId);

    return translation;
  }

  // 删除翻译
  async deleteTranslation(id: string) {
    const translation = await this.prisma.translation.findUnique({
      where: { id },
    });

    if (translation) {
      await this.prisma.translation.delete({
        where: { id },
      });

      // 使缓存失效
      await this.invalidateCache(
        translation.locale,
        translation.namespaceId
      );
    }

    return translation;
  }

  // 批量创建或更新翻译
  async upsertTranslations(projectId: string, translations: TranslationRequest[]) {
    const results = [];

    try {
      for (const item of translations) {
        try {
          // 获取语言
          let locale = await this.localeService.getLocaleByCode(item.locale);

          if (!locale) {
            // 如果语言不存在，则创建一个新的
            locale = await this.localeService.createLocale({
              code: item.locale,
              name: item.locale,
              nativeName: item.locale
            });
          }

          // 获取或创建命名空间
          const namespace = await this.namespaceService.getOrCreateNamespace(
            item.namespace,
            projectId
          );

          // 查找现有翻译
          const existingTranslation = await this.getTranslation(
            item.key,
            item.locale,
            namespace.id
          );

          let translation;

          if (existingTranslation) {
            // 更新翻译
            translation = await this.updateTranslation(existingTranslation.id, {
              key: item.key,
              value: item.value,
              locale: item.locale,
              description: item.description,
              namespaceId: namespace.id,
            });
          } else {
            // 创建翻译
            translation = await this.createTranslation({
              key: item.key,
              value: item.value,
              locale: item.locale,
              description: item.description,
              namespaceId: namespace.id,
            });
          }

          results.push(translation);
        } catch (itemError) {
          console.error(`处理翻译项时出错: ${item.key}`, itemError);
          // 继续处理下一个翻译项，而不是中断整个过程
        }
      }
    } catch (error) {
      console.error('批量处理翻译时出错:', error);
    }

    return results;
  }

  // 获取项目的所有翻译，按语言和命名空间组织
  async getTranslationsForProject(projectId: string, locale: string, namespaceName?: string) {
    try {
      // 尝试从缓存获取
      const cacheKey = this.getCacheKey(projectId, locale, namespaceName);
      const cachedData = await this.redis.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // 获取语言
      const localeObj = await this.localeService.getLocaleByCode(locale);

      // 如果语言不存在，则创建一个空的结果
      if (!localeObj) {
        // 返回空对象而不是抛出错误
        return {};
      }

      // 获取项目的命名空间
      let namespaces = await this.namespaceService.getNamespacesByProjectId(projectId);

      // 如果指定了命名空间，则过滤
      if (namespaceName) {
        namespaces = namespaces.filter(ns => ns.name === namespaceName);

        // 如果命名空间不存在，则返回空对象
        if (namespaces.length === 0) {
          return { [namespaceName]: {} };
        }
      }

      // 组织翻译数据
      const result: TranslationResponse = {};

      // 对每个命名空间查询翻译
      for (const namespace of namespaces) {
        const translations = await this.prisma.translation.findMany({
          where: {
            namespaceId: namespace.id,
            locale: locale,
          },
          orderBy: {
            key: 'asc',
          },
        });

        // 确保命名空间存在
        if (!result[namespace.name]) {
          result[namespace.name] = {};
        }

        // 处理每个翻译
        for (const translation of translations) {
          try {
            const keyParts = translation.key.split('.');

            // 首先确保命名空间存在并且是一个对象
            if (!result[namespace.name] || typeof result[namespace.name] === 'string') {
              result[namespace.name] = {};
            }

            // 将完整的键存储为扁平结构
            // 例如，将 app.about.description 存储为 { "app.about.description": "关于本站的描述" }
            (result[namespace.name] as TranslationResponse)[translation.key] = translation.value;

            // 然后尝试构建嵌套结构，但要避免类型冲突
            let current: any = result[namespace.name];
            let canNest = true;

            for (let i = 0; i < keyParts.length - 1; i++) {
              const part = keyParts[i];

              if (!current[part]) {
                current[part] = {};
              } else if (typeof current[part] !== 'object') {
                // 如果当前节点不是对象，跳过后续处理
                canNest = false;
                break;
              }

              current = current[part];
            }

            // 只有当前节点是对象时才设置最后一个键的值
            if (canNest && typeof current === 'object') {
              current[keyParts[keyParts.length - 1]] = translation.value;
            }
          } catch (error) {
            console.error(`处理翻译时出错: ${translation.key}`, error);
            // 继续处理下一个翻译，而不是中断整个过程
          }
        }
      }

      // 缓存结果
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', REDIS.TTL);

      return result;
    } catch (error) {
      console.error('获取项目翻译时出错:', error);
      // 抛出错误以便更好地调试
      throw error;
    }
  }

  // 使缓存失效
  async invalidateCache(locale: string, namespaceId: string) {
    // 获取命名空间
    const namespace = await this.prisma.namespace.findUnique({
      where: { id: namespaceId },
    });

    if (namespace) {
      // 获取项目ID
      const projectId = namespace.projectId;

      // 使特定命名空间的缓存失效
      const specificCacheKey = this.getCacheKey(projectId, locale, namespace.name);
      await this.redis.del(specificCacheKey);

      // 使整个语言的缓存失效
      const allNamespacesCacheKey = this.getCacheKey(projectId, locale);
      await this.redis.del(allNamespacesCacheKey);
    }
  }

  // 获取缓存键
  getCacheKey(projectId: string, locale: string, namespaceName?: string) {
    return namespaceName
      ? `translations:${projectId}:${locale}:${namespaceName}`
      : `translations:${projectId}:${locale}`;
  }

  // 清除所有缓存
  async clearAllCache() {
    try {
      // 获取所有以translations:开头的键
      const keys = await this.redis.keys('translations:*');

      if (keys.length > 0) {
        // 删除所有翻译缓存
        await this.redis.del(...keys);
        console.log(`已清除 ${keys.length} 个翻译缓存键`);
      } else {
        console.log('没有找到翻译缓存键');
      }

      return true;
    } catch (error) {
      console.error('清除缓存时出错:', error);
      return false;
    }
  }
}
