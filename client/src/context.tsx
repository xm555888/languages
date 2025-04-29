import * as React from 'react';
import { TranslationClient } from './client';
import { TranslationContextType, TranslationProviderProps, TranslationResponse } from './types';

// 创建翻译上下文
const TranslationContext = React.createContext<TranslationContextType>({
  t: (key) => key,
  locale: 'zh-CN',
  setLocale: () => {},
  namespaces: [],
  isLoading: false,
  error: null,
});

// 导出上下文钩子
export const useTranslationContext = () => React.useContext(TranslationContext);

// 翻译提供者组件
export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  options,
  initialLocale,
  initialNamespaces = ['common'],
}) => {
  const [client] = React.useState(() => new TranslationClient(options));
  const [locale, setLocale] = React.useState(initialLocale || options.defaultLocale || 'zh-CN');
  const [namespaces, setNamespaces] = React.useState<string[]>(initialNamespaces);
  const [translations, setTranslations] = React.useState<Record<string, TranslationResponse>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // 加载翻译
  React.useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const newTranslations: Record<string, TranslationResponse> = {};

        // 加载每个命名空间的翻译
        for (const namespace of namespaces) {
          try {
            const data = await client.getTranslations(locale, namespace);
            // 检查数据结构
            console.log(`Raw data for namespace ${namespace}:`, data);
            if (data && typeof data === 'object') {
              // API返回的数据结构是 {"common": {...}}
              // 我们需要将整个数据对象保存下来，以便在t函数中处理嵌套结构
              newTranslations[namespace] = data as TranslationResponse;
              console.log(`Saved data for namespace ${namespace}:`, newTranslations[namespace]);

              // 不再使用硬编码的翻译数据，完全依赖数据库中的翻译
            } else {
              // 如果数据无效，使用空对象
              newTranslations[namespace] = {};
              console.log(`Invalid data for namespace ${namespace}, using empty object`);
            }
            console.log(`Loaded translations for ${namespace}:`, newTranslations[namespace]);
          } catch (nsError) {
            console.error(`加载命名空间 ${namespace} 的翻译失败:`, nsError);
            newTranslations[namespace] = {};
          }
        }

        setTranslations(newTranslations);
      } catch (err) {
        console.error('加载翻译失败:', err);
        setError(err instanceof Error ? err : new Error('加载翻译失败'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [client, locale, namespaces]);

  // 使用 ref 存储待添加的命名空间，避免在渲染期间更新状态
  const pendingNamespacesRef = React.useRef<Set<string>>(new Set());

  // 添加命名空间 - 不再直接更新状态，而是将命名空间添加到 ref 中
  const addNamespace = (namespace: string) => {
    if (!namespaces.includes(namespace)) {
      pendingNamespacesRef.current.add(namespace);
      // 使用 setTimeout 将状态更新推迟到下一个事件循环，避免渲染期间的状态更新
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          if (pendingNamespacesRef.current.size > 0) {
            setNamespaces(prev => {
              const newNamespaces = [...prev];
              pendingNamespacesRef.current.forEach(ns => {
                if (!newNamespaces.includes(ns)) {
                  newNamespaces.push(ns);
                }
              });
              pendingNamespacesRef.current.clear();
              return newNamespaces;
            });
          }
        }, 0);
      }
    }
  };

  // 使用 useEffect 处理待添加的命名空间
  React.useEffect(() => {
    if (pendingNamespacesRef.current.size > 0) {
      setNamespaces(prev => {
        const newNamespaces = [...prev];
        pendingNamespacesRef.current.forEach(ns => {
          if (!newNamespaces.includes(ns)) {
            newNamespaces.push(ns);
          }
        });
        pendingNamespacesRef.current.clear();
        return newNamespaces;
      });
    }
  }, []);

  // 翻译函数
  const t = (key: string, params?: Record<string, string>, namespace?: string): string => {
    const ns = namespace || options.defaultNamespace || 'common';

    // 减少日志输出，只保留必要的调试信息
    // console.log(`t() called with key: ${key}, namespace: ${ns}`);

    // 检查命名空间是否已加载
    if (!translations[ns]) {
      // 如果命名空间未加载，添加到命名空间列表
      // 静默加载命名空间，不显示调试信息
      addNamespace(ns);
      return key; // 返回键，等待命名空间加载
    }

    try {
      // 首先检查完整的键是否存在
      if (translations[ns][key] && typeof translations[ns][key] === 'string') {
        return translations[ns][key] as string;
      }

      // 如果完整键不存在，尝试嵌套路径
      const keyParts = key.split('.');

      // 尝试多种数据结构模式

      // 模式1: 检查命名空间对象中是否包含命名空间键
      // 例如: translations['planets']['planets']['mercury']['description']
      if (translations[ns][ns] && typeof translations[ns][ns] === 'object') {
        let nsValue: any = translations[ns][ns];
        let found = true;
        let result = nsValue;

        for (const part of keyParts) {
          if (!result || typeof result !== 'object') {
            found = false;
            break;
          }
          result = result[part];
        }

        if (found && typeof result === 'string') {
          return result;
        }
      }

      // 模式2: 直接在命名空间对象中查找完整路径
      // 例如: translations['planets']['planet']['mercury']['description']
      let value: any = translations[ns];
      let found = true;

      for (const part of keyParts) {
        if (!value || typeof value !== 'object') {
          found = false;
          break;
        }
        value = value[part];
      }

      if (found && typeof value === 'string') {
        return value;
      }

      // 模式3: 尝试在扁平化结构中查找
      // 例如: translations['planets']['planet.mercury.description']
      const flatKey = keyParts.join('.');
      if (translations[ns][flatKey] && typeof translations[ns][flatKey] === 'string') {
        return translations[ns][flatKey] as string;
      }

      // 如果所有尝试都失败，但有参数需要替换
      // 尝试在键本身中替换参数，这样至少可以显示参数值
      if (params) {
        // 如果value是字符串，使用value进行替换
        if (typeof value === 'string') {
          return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            return acc.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
          }, value);
        }
        // 如果value不是字符串，但键中包含占位符，尝试在键中替换
        else if (key.includes('{') && key.includes('}')) {
          return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            return acc.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
          }, key);
        }
      }

      return key; // 如果找不到翻译，返回键本身
    } catch (error) {
      // 只在开发环境下显示错误
      if (process.env.NODE_ENV === 'development') {
        console.error(`翻译错误: ${key}`, error);
      }
      return key;
    }
  };

  // 切换语言
  const handleSetLocale = (newLocale: string) => {
    // 清除缓存
    client.clearCache();

    // 设置新语言
    setLocale(newLocale);

    // 如果在浏览器环境中，保存语言设置到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);

      // 更新HTML标签的lang属性
      document.documentElement.lang = newLocale;
    }
  };

  // 在第一次挂载时，从本地存储中获取语言设置
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');

      if (savedLocale) {
        setLocale(savedLocale);
      }

      // 设置HTML标签的lang属性
      document.documentElement.lang = locale;
    }
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        t,
        locale,
        setLocale: handleSetLocale,
        namespaces,
        isLoading,
        error,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
