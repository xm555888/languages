/**
 * 使用翻译钩子
 * @param namespace 命名空间
 * @returns 翻译函数和语言设置
 */
export declare function useTranslation(namespace?: string): import("./types").TranslationContextType;
/**
 * 使用语言钩子
 * @returns 当前语言和设置语言的函数
 */
export declare function useLocale(): {
    locale: string;
    setLocale: (locale: string) => void;
};
/**
 * 使用加载状态钩子
 * @returns 加载状态
 */
export declare function useTranslationLoading(): boolean;
/**
 * 使用错误状态钩子
 * @returns 错误状态
 */
export declare function useTranslationError(): Error | null;
