import axios, { AxiosInstance } from 'axios';
import { TranslationResponse, TranslationClientOptions, Cache, CacheItem } from './types';

export class TranslationClient {
  private axios: AxiosInstance;
  private options: TranslationClientOptions;
  private cache: Cache = {};

  constructor(options: TranslationClientOptions) {
    this.options = {
      apiUrl: 'http://localhost:3100/api/v1',
      defaultLocale: 'zh-CN',
      cache: true,
      cacheTTL: 3600000, // 1小时
      ...options,
    };

    this.axios = axios.create({
      baseURL: this.options.apiUrl,
      timeout: 10000,
    });
  }

  /**
   * 获取翻译
   * @param locale 语言代码
   * @param namespace 命名空间
   * @returns 翻译数据
   */
  async getTranslations(locale: string, namespace?: string): Promise<TranslationResponse> {
    // 根据语言代码进行标准化
    // 如果是简化的语言代码，转换为完整的语言代码
    let normalizedLocale = locale;
    // 不再将'en'转换为'en-US'，因为数据库中使用的是'en'
    // if (locale === 'en') normalizedLocale = 'en-US';
    if (locale === 'zh') normalizedLocale = 'zh-CN';

    const cacheKey = this.getCacheKey(normalizedLocale, namespace);

    // 如果启用了缓存，尝试从缓存获取
    if (this.options.cache && this.cache[cacheKey]) {
      const cacheItem = this.cache[cacheKey];
      const now = Date.now();

      // 检查缓存是否过期
      if (now - cacheItem.timestamp < (this.options.cacheTTL || 3600000)) {
        // 静默使用缓存，不显示调试信息
        return cacheItem.data;
      }
    }

    try {
      // 检查是否提供了项目ID
      if (!this.options.projectId) {
        throw new Error('需要提供 projectId 才能获取翻译');
      }

      let url = `/translations/${this.options.projectId}/${normalizedLocale}`;

      if (namespace) {
        url += `/${namespace}`;
      }

      // 静默获取翻译数据，不显示调试信息
      const response = await this.axios.get<TranslationResponse>(url);

      // 不要提取命名空间的数据，而是直接返回原始数据
      // 这样在context.tsx中可以正确处理嵌套结构

      // 如果启用了缓存，将结果缓存
      if (this.options.cache) {
        this.cache[cacheKey] = {
          data: response.data,
          timestamp: Date.now(),
        };
      }

      return response.data;
    } catch (error) {
      // 只在开发环境下显示错误
      if (process.env.NODE_ENV === 'development') {
        console.error(`获取翻译失败 (${normalizedLocale}/${namespace || 'all'})`);
      }
      // 返回空对象而不是抛出错误
      return {};
    }
  }

  /**
   * 清除缓存
   * @param locale 语言代码
   * @param namespace 命名空间
   */
  clearCache(locale?: string, namespace?: string): void {
    if (locale && namespace) {
      // 清除特定语言和命名空间的缓存
      const cacheKey = this.getCacheKey(locale, namespace);
      delete this.cache[cacheKey];
    } else if (locale) {
      // 清除特定语言的所有缓存
      Object.keys(this.cache).forEach((key) => {
        if (key.startsWith(`${locale}:`)) {
          delete this.cache[key];
        }
      });
    } else {
      // 清除所有缓存
      this.cache = {};
    }
  }

  /**
   * 获取缓存键
   * @param locale 语言代码
   * @param namespace 命名空间
   * @returns 缓存键
   */
  private getCacheKey(locale: string, namespace?: string): string {
    return namespace ? `${locale}:${namespace}` : locale;
  }
}
