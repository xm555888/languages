// 翻译响应类型
export interface TranslationResponse {
  [key: string]: string | TranslationResponse;
}

// 翻译选项
export interface TranslationOptions {
  apiUrl?: string;
  projectId: string;
  defaultLocale?: string;
  defaultNamespace?: string;
  cache?: boolean;
  cacheTTL?: number;
}

// 翻译上下文类型
export interface TranslationContextType {
  t: (key: string, params?: Record<string, string>, namespace?: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  namespaces: string[];
  isLoading: boolean;
  error: Error | null;
}

// 翻译提供者属性
export interface TranslationProviderProps {
  children: React.ReactNode;
  options: TranslationOptions;
  initialLocale?: string;
  initialNamespaces?: string[];
}

// 翻译钩子选项
export interface UseTranslationOptions {
  namespace?: string;
}

// 翻译客户端选项
export interface TranslationClientOptions {
  apiUrl?: string;
  projectId: string;
  defaultLocale?: string;
  cache?: boolean;
  cacheTTL?: number;
}

// 缓存项类型
export interface CacheItem {
  data: TranslationResponse;
  timestamp: number;
}

// 缓存类型
export interface Cache {
  [key: string]: CacheItem;
}
