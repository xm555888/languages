import { useTranslationContext } from './context';
import { UseTranslationOptions } from './types';

/**
 * 使用翻译钩子
 * @param namespace 命名空间
 * @returns 翻译函数和语言设置
 */
export function useTranslation(namespace?: string) {
  const context = useTranslationContext();

  // 如果没有提供命名空间，直接返回上下文
  if (!namespace) {
    return context;
  }

  // 创建一个新的翻译函数，默认使用指定的命名空间
  const t = (key: string, params?: Record<string, string>, ns?: string) => {
    return context.t(key, params, ns || namespace);
  };

  return {
    ...context,
    t,
  };
}

/**
 * 使用语言钩子
 * @returns 当前语言和设置语言的函数
 */
export function useLocale() {
  const { locale, setLocale } = useTranslationContext();
  return { locale, setLocale };
}

/**
 * 使用加载状态钩子
 * @returns 加载状态
 */
export function useTranslationLoading() {
  const { isLoading } = useTranslationContext();
  return isLoading;
}

/**
 * 使用错误状态钩子
 * @returns 错误状态
 */
export function useTranslationError() {
  const { error } = useTranslationContext();
  return error;
}
