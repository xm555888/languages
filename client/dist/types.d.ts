export interface TranslationResponse {
    [key: string]: string | TranslationResponse;
}
export interface TranslationOptions {
    apiUrl?: string;
    projectId: string;
    defaultLocale?: string;
    defaultNamespace?: string;
    cache?: boolean;
    cacheTTL?: number;
}
export interface TranslationContextType {
    t: (key: string, params?: Record<string, string>, namespace?: string) => string;
    locale: string;
    setLocale: (locale: string) => void;
    namespaces: string[];
    isLoading: boolean;
    error: Error | null;
}
export interface TranslationProviderProps {
    children: React.ReactNode;
    options: TranslationOptions;
    initialLocale?: string;
    initialNamespaces?: string[];
}
export interface UseTranslationOptions {
    namespace?: string;
}
export interface TranslationClientOptions {
    apiUrl?: string;
    projectId: string;
    defaultLocale?: string;
    cache?: boolean;
    cacheTTL?: number;
}
export interface CacheItem {
    data: TranslationResponse;
    timestamp: number;
}
export interface Cache {
    [key: string]: CacheItem;
}
