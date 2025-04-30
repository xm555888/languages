# Language 多语言模块

Language是一个高性能的多语言模块系统，专为Next.js项目提供多语言支持。它基于Fastify构建，使用PostgreSQL存储翻译数据，并通过Redis缓存优化性能。

## 功能特点

- 🚀 高性能API服务，基于Fastify构建
- 💾 PostgreSQL数据库存储翻译数据
- ⚡ Redis缓存优化性能
- 🔄 实时更新翻译内容
- 🧩 易于集成的React客户端SDK
- 🌐 支持多项目、多语言、多命名空间
- 🔍 占位符支持，可动态替换翻译中的变量

## 支持的语言

Language模块支持多种语言代码，主要使用以下格式：

- `zh-CN`: 简体中文
- `en`: 英文

您可以根据需要添加更多语言，如`zh-TW`（繁体中文）、`ja`（日语）、`ko`（韩语）等。

## 完整使用流程

### 1. 环境配置

在项目根目录创建`.env`文件，添加以下配置：

```env
# Language服务配置
LANGUAGES_PORT=3100
LANGUAGES_HOST=0.0.0.0
LANGUAGES_NODE_ENV=development

# 数据库配置
LANGUAGE_DATABASE_URL=postgresql://postgres:123456789@localhost:5432/language_service?schema=public

# Redis配置（可选，用于缓存优化）
LANGUAGE_REDIS_URL=redis://localhost:6379
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动服务

```bash
npm run dev
```

服务将在`http://localhost:3100`启动。

### 5. 创建项目和翻译数据

使用scripts文件夹下的导入脚本来创建项目和导入翻译数据：

步骤1：准备一个包含项目和翻译数据的JSON文件，格式如下：

```json
{
  "project": {
    "id": "your-project-id",
    "name": "项目名称",
    "description": "项目描述"
  },
  "locales": [
    {
      "code": "zh-CN",
      "name": "简体中文",
      "nativeName": "简体中文",
      "isDefault": true
    },
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "isDefault": false
    }
  ],
  "namespaces": [
    {
      "name": "common",
      "translations": {
        "zh-CN": {
          "hello": "你好",
          "welcome": "欢迎 {name}"
        },
        "en": {
          "hello": "Hello",
          "welcome": "Welcome {name}"
        }
      }
    }
  ]
}
```

步骤2：运行导入脚本：

```bash
node scripts/import-translations.js path/to/your-translations.json
```

或者使用交互模式：

```bash
node scripts/import-translations.js
```

步骤3：记录项目ID，后续在Next.js项目集成时需要使用。

## 在Next.js项目中集成

### 1. 安装客户端SDK

```bash
npm install language-client
```

### 2. 配置TranslationProvider

在你的Next.js应用中，添加`LanguageProvider`组件：

```tsx
// src/i18n/LanguageProvider.tsx
'use client';

import React from 'react';
import { TranslationProvider } from 'language-client';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider
      options={{
        apiUrl: process.env.NEXT_PUBLIC_LANGUAGE_API_URL || 'http://localhost:3100/api/v1',
        projectId: process.env.NEXT_PUBLIC_LANGUAGE_PROJECT_ID || '你的项目ID',
        defaultLocale: 'zh-CN',
        defaultNamespace: 'common',
        cache: true,
        cacheTTL: 3600000, // 1小时
      }}
      initialLocale="zh-CN"
      initialNamespaces={['common', 'home']}
    >
      {children}
    </TranslationProvider>
  );
}

export default LanguageProvider;
```

### 3. 在应用中使用Provider

在你的Next.js应用的根组件中使用`LanguageProvider`：

```tsx
// src/app/layout.tsx
import { LanguageProvider } from '@/i18n/LanguageProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

### 4. 使用翻译钩子

在组件中使用`useTranslation`钩子获取翻译：

```tsx
'use client';

import { useTranslation } from 'language-client';

export default function HomePage() {
  // 使用特定命名空间的翻译
  const { t } = useTranslation('home');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 5. 切换语言

使用`useLocale`钩子切换语言：

```tsx
'use client';

import { useLocale } from 'language-client';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div>
      <button onClick={() => setLocale('zh-CN')}>中文</button>
      <button onClick={() => setLocale('en')}>English</button>
      <p>当前语言: {locale}</p>
    </div>
  );
}
```

## 导入和导出翻译数据

### 导出翻译数据

使用scripts文件夹下的导出脚本将项目的翻译数据导出为JSON文件：

```bash
node scripts/export-translations.js your-project-id
```

导出的文件将保存在`exports`目录下，文件名格式为`translations_项目名称_时间戳.json`。

### 导入翻译数据

使用scripts文件夹下的导入脚本从JSON文件导入翻译数据：

```bash
node scripts/import-translations.js path/to/translations.json
```

如果不提供文件路径，脚本将进入交互模式，引导您完成导入过程：

```bash
node scripts/import-translations.js
```

交互模式会提示您：

1. 输入翻译数据文件路径（如果不提供，将使用exports目录下的最新文件）
2. 是否创建/更新项目
3. 是否创建/更新语言
4. 是否覆盖现有翻译

## Docker部署

### 1. 构建Docker镜像

```bash
docker build -t language-service .
```

### 2. 使用Docker Compose启动服务

```bash
docker-compose up -d
```

### 3. Docker环境下的翻译数据导入

当服务部署在Docker容器中时，您可以通过以下方式导入翻译数据：

步骤1：确保PostgreSQL端口已映射到主机：

   ```yaml
   # docker-compose.yml
   services:
     postgres:
       # ...其他配置
       ports:
         - "5432:5432"  # 将容器的5432端口映射到主机的5432端口
   ```

步骤2：修改导入脚本中的数据库连接字符串：

   ```js
   // 修改scripts/import-translations.js中的数据库连接
   process.env.DATABASE_URL = 'postgresql://postgres:123456789@localhost:5432/languages';
   ```

步骤3：运行导入脚本：

   ```bash
   node scripts/import-translations.js path/to/translations.json
   ```

## 处理占位符

Language模块支持在翻译中使用占位符，并在运行时替换为实际值。

### 推荐的占位符处理方式

```tsx
// 定义翻译键（在language_service数据库中）
// "welcomeMessage": "欢迎 {name}，你有 {count} 条新消息"

// 在组件中使用
const { t } = useTranslation('common');
const name = 'John';
const count = 5;

// 使用replace手动替换占位符（推荐）
<p>{t('welcomeMessage').replace('{name}', name).replace('{count}', count.toString())}</p>

// 对于包含HTML的占位符，使用dangerouslySetInnerHTML
<p dangerouslySetInnerHTML={{
  __html: t('welcomeMessage').replace('{name}', `<strong>${name}</strong>`).replace('{count}', count.toString())
}} />
```

## API参考

### 客户端API

#### useTranslation(namespace?: string)

获取翻译函数和语言设置。

```tsx
const { t, locale, setLocale } = useTranslation('common');
```

#### useLocale()

获取当前语言和设置语言的函数。

```tsx
const { locale, setLocale } = useLocale();
```

#### t(key: string, namespace?: string)

翻译函数，用于获取翻译文本。

```tsx
// 基本用法
t('hello'); // 从当前命名空间获取'hello'的翻译

// 使用不同的命名空间
t('hello', 'common'); // 从'common'命名空间获取'hello'的翻译

// 推荐的占位符处理方式
t('welcome').replace('{name}', 'John'); // 更可靠的占位符替换方式
```

### 服务端API

Language模块提供了以下REST API端点：

#### 获取翻译

```http
GET /api/v1/translations/:projectId/:locale/:namespace
```

- `projectId`: 项目ID
- `locale`: 语言代码，如'zh-CN'、'en'
- `namespace`: 命名空间，如'common'、'home'

#### 获取项目的所有语言

```http
GET /api/v1/:projectId/languages
```

## 最佳实践

1. **命名空间组织**：按功能或页面组织翻译，如'common'、'hero'、'features'、'pricing'、'footer'等。

2. **占位符处理**：使用`replace`方法处理占位符，而不是嵌套的t函数调用。

3. **缓存优化**：启用客户端缓存，减少API请求。

4. **预加载翻译**：在`TranslationProvider`中预加载常用命名空间。

5. **错误处理**：为缺失的翻译提供合理的回退值。

## 故障排除

### 翻译未显示或显示键名

1. 检查命名空间是否正确
2. 确认翻译键在数据库中存在
3. 检查网络请求是否成功
4. 查看控制台是否有错误信息

### 占位符未正确替换

使用推荐的`replace`方法处理占位符：

```tsx
// 推荐
t('welcome').replace('{name}', userName)
```

### 语言切换无效

1. 确保`setLocale`函数被正确调用
2. 检查浏览器控制台是否有错误
3. 验证新语言的翻译是否存在于数据库中

## 许可证

MIT
