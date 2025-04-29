import { TranslationResponse, TranslationClientOptions } from './types';
export declare class TranslationClient {
    private axios;
    private options;
    private cache;
    constructor(options: TranslationClientOptions);
    /**
     * 获取翻译
     * @param locale 语言代码
     * @param namespace 命名空间
     * @returns 翻译数据
     */
    getTranslations(locale: string, namespace?: string): Promise<TranslationResponse>;
    /**
     * 清除缓存
     * @param locale 语言代码
     * @param namespace 命名空间
     */
    clearCache(locale?: string, namespace?: string): void;
    /**
     * 获取缓存键
     * @param locale 语言代码
     * @param namespace 命名空间
     * @returns 缓存键
     */
    private getCacheKey;
}
