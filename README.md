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

## 快速开始

### 1. 环境配置

在项目根目录创建或编辑`.env`文件，添加以下配置：

```env
# Language服务配置
LANGUAGES_PORT=3100
LANGUAGES_HOST=0.0.0.0
LANGUAGES_NODE_ENV=development

# 数据库配置
LANGUAGE_DATABASE_URL=postgresql://postgres:123456789@localhost:5432/language_service?schema=public

# Redis配置（可选，用于缓存优化）
REDIS_URL=redis://localhost:6379
```

### 2. 安装依赖

```bash
cd languages
npm install
```

### 3. 初始化数据库

```bash
cd languages
npx prisma migrate dev
```

### 4. 启动服务

```bash
cd languages
npm run dev
```

服务将在`http://localhost:3100`启动。

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

import { useTranslation } from '@/i18n/useLanguage';

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

import { useLocale } from '@/i18n/useLanguage';

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

## 处理占位符

Language模块支持在翻译中使用占位符，并在运行时替换为实际值。

### 正确的占位符处理方式

在使用占位符时，推荐使用以下方式处理：

```tsx
// 定义翻译键（在language_service数据库中）
// "welcomeMessage": "欢迎 {name}，你有 {count} 条新消息"
// "priceInfo": "每张图片仅需 {price} 元"

// 在组件中使用
const { t } = useTranslation('common');
const name = 'John';
const count = 5;
const price = 9.9;

// 方法1：使用replace手动替换占位符（推荐）
<p>{t('welcomeMessage').replace('{name}', name).replace('{count}', count.toString())}</p>

// 方法2：对于包含HTML的占位符，使用dangerouslySetInnerHTML
<p dangerouslySetInnerHTML={{
  __html: t('welcomeMessage').replace('{name}', `<strong>${name}</strong>`).replace('{count}', count.toString())
}} />

// 实际项目中的例子
<p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
  {/* 手动处理占位符，避免使用t函数的嵌套调用 */}
  {t('description').replace('{price}', t('specialPrice'))}
</p>

<div className="text-xs text-gray-400 mt-2">
  <span dangerouslySetInnerHTML={{
    __html: t('getPoints').replace('{count}', `<span class="text-primary">${points}</span>`)
  }} />
</div>
```

这种方式比使用嵌套的t函数调用更可靠，特别是在处理复杂占位符时。在实际项目中，我们发现使用replace方法可以避免很多渲染问题，特别是当占位符中包含动态内容或HTML标签时。

## API参考

### 客户端API

#### useTranslation(namespace?: string)

获取翻译函数和语言设置。

```tsx
const { t, locale, setLocale } = useTranslation('common');
```

- `namespace`: 可选，指定要使用的命名空间。如果不提供，将使用默认命名空间。

#### useLocale()

获取当前语言和设置语言的函数。

```tsx
const { locale, setLocale } = useLocale();
```

#### t(key: string, params?: Record<string, string>, namespace?: string)

翻译函数，用于获取翻译文本。

```tsx
// 基本用法
t('hello'); // 从当前命名空间获取'hello'的翻译

// 使用不同的命名空间
t('hello', {}, 'common'); // 从'common'命名空间获取'hello'的翻译

// 使用占位符（不推荐，容易出现问题）
t('welcome', { name: 'John' }); // 如果'welcome'是'欢迎 {name}'，将返回'欢迎 John'

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

返回指定项目、语言和命名空间的所有翻译。

#### 获取项目的所有语言

```http
GET /api/v1/:projectId/languages
```

返回项目支持的所有语言。

## 导入翻译数据

有多种方法可以导入翻译数据，包括本地开发环境和Docker部署环境。

### 方法1：使用API接口批量导入（推荐）

这是最简单的方法，适用于本地开发环境和Docker部署环境，不需要直接访问数据库。

#### 步骤1 - 准备翻译数据JSON文件，格式如下

```json
{
  "translations": [
    {
      "key": "hello",
      "value": "你好",
      "locale": "zh-CN",
      "namespace": "common",
      "description": "问候语"
    },
    {
      "key": "welcome",
      "value": "欢迎 {name}",
      "locale": "zh-CN",
      "namespace": "common",
      "description": "欢迎信息"
    },
    {
      "key": "hello",
      "value": "Hello",
      "locale": "en",
      "namespace": "common",
      "description": "Greeting"
    },
    {
      "key": "welcome",
      "value": "Welcome {name}",
      "locale": "en",
      "namespace": "common",
      "description": "Welcome message"
    }
  ]
}
```

#### 步骤2 - 使用PowerShell脚本调用API导入翻译数据

```powershell
# 设置项目ID
$projectId = "你的项目ID"

# 读取JSON文件
$jsonObj = Get-Content -Path "path/to/translations.json" | ConvertFrom-Json

# 转换为JSON字符串
$jsonBody = $jsonObj | ConvertTo-Json -Depth 10 -Compress

# 调用API
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3100/api/v1/$projectId/translations/batch" -Body $jsonBody -ContentType "application/json"

# 显示结果
$response.Content
```

#### 步骤3 - 如果服务部署在Docker中，只需将URL替换为Docker容器的地址

```powershell
# 对于本地Docker部署
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3100/api/v1/$projectId/translations/batch" -Body $jsonBody -ContentType "application/json"

# 对于远程Docker部署
$response = Invoke-WebRequest -Method POST -Uri "http://your-server-address:3100/api/v1/$projectId/translations/batch" -Body $jsonBody -ContentType "application/json"
```

### 方法2：使用导入脚本

项目提供了一个更强大的导入脚本，可以从JSON文件导入完整的项目、语言和翻译数据。

#### 步骤1 - 准备导入数据JSON文件，格式如下

```json
{
  "project": {
    "id": "你的项目ID",
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

#### 步骤2 - 对于本地开发环境，直接运行脚本

```bash
cd languages
node scripts/import-translations-from-file.js path/to/import-data.json
```

#### 步骤3 - 对于Docker部署环境，修改脚本中的数据库连接字符串

```js
// 修改scripts/import-translations-from-file.js中的数据库连接
process.env.DATABASE_URL = 'postgresql://postgres:123456789@your-docker-postgres-host:5432/language_service';
```

然后运行脚本：

```bash
cd languages
node scripts/import-translations-from-file.js path/to/import-data.json
```

### 方法3：使用自定义导入脚本

你也可以创建自定义脚本，根据特定需求导入翻译数据：

```js
// languages/scripts/import-translations.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 项目ID
const PROJECT_ID = '你的项目ID';

// 翻译数据
const translations = {
  common: {
    'zh-CN': {
      'hello': '你好',
      'welcome': '欢迎 {name}'
    },
    'en': {
      'hello': 'Hello',
      'welcome': 'Welcome {name}'
    }
  }
};

// 导入翻译数据到数据库
async function importTranslations() {
  try {
    console.log('开始导入翻译数据...');

    // 获取项目信息
    const project = await prisma.project.findUnique({
      where: { id: PROJECT_ID },
    });

    if (!project) {
      throw new Error(`找不到项目ID: ${PROJECT_ID}`);
    }

    console.log(`找到项目: ${project.name} (${project.id})`);

    // 遍历每个命名空间
    for (const [namespaceName, locales] of Object.entries(translations)) {
      console.log(`处理命名空间: ${namespaceName}`);

      // 查找或创建命名空间
      let namespace = await prisma.namespace.findFirst({
        where: {
          name: namespaceName,
          projectId: project.id,
        },
      });

      if (!namespace) {
        namespace = await prisma.namespace.create({
          data: {
            name: namespaceName,
            projectId: project.id,
          },
        });
        console.log(`  创建命名空间: ${namespaceName}`);
      }

      // 遍历每种语言
      for (const [localeCode, translations] of Object.entries(locales)) {
        console.log(`  处理语言: ${localeCode}`);

        // 检查语言是否存在
        let locale = await prisma.locale.findFirst({
          where: { code: localeCode },
        });

        if (!locale) {
          // 创建语言
          locale = await prisma.locale.create({
            data: {
              code: localeCode,
              name: localeCode === 'zh-CN' ? '简体中文' : 'English',
              nativeName: localeCode === 'zh-CN' ? '简体中文' : 'English',
              isActive: true,
              isDefault: localeCode === 'zh-CN', // 设置中文为默认语言
            },
          });
          console.log(`    创建语言: ${localeCode}`);
        }

        // 遍历该语言下的所有翻译键
        for (const [key, value] of Object.entries(translations)) {
          // 检查翻译是否已存在
          const existingTranslation = await prisma.translation.findFirst({
            where: {
              namespaceId: namespace.id,
              locale: localeCode,
              key,
            },
          });

          if (existingTranslation) {
            // 更新现有翻译
            await prisma.translation.update({
              where: { id: existingTranslation.id },
              data: { value },
            });
            console.log(`    更新翻译: ${namespaceName}.${key} (${localeCode})`);
          } else {
            // 创建新翻译
            await prisma.translation.create({
              data: {
                key,
                value,
                locale: localeCode,
                namespaceId: namespace.id,
              },
            });
            console.log(`    创建翻译: ${namespaceName}.${key} (${localeCode})`);
          }
        }
      }
    }

    console.log('翻译数据导入完成！');
  } catch (error) {
    console.error('导入翻译数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
importTranslations();
```

执行脚本：

```bash
cd languages
node scripts/import-translations.js
```

## Docker部署环境下的翻译数据导入

当服务部署在Docker容器中时，我们推荐使用以下方法导入翻译数据：

### 使用导入脚本（推荐）

这是最可靠的方法，可以直接将翻译数据导入到Docker容器中的数据库。

#### 步骤1 - 准备导入数据JSON文件

创建一个包含项目、语言和翻译数据的JSON文件，格式如下：

```json
{
  "project": {
    "id": "你的项目ID",
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

#### 步骤2 - 确保Docker容器的PostgreSQL端口已映射到主机

在docker-compose.yml文件中，确保PostgreSQL容器的端口已映射到主机：

```yaml
services:
  postgres:
    # ...其他配置
    ports:
      - "5432:5432"  # 将容器的5432端口映射到主机的5432端口
```

#### 步骤3 - 修改脚本中的数据库连接字符串

修改scripts/import-translations-from-file.js文件中的数据库连接字符串，使其连接到Docker容器中的PostgreSQL：

```js
// 修改scripts/import-translations-from-file.js中的数据库连接
process.env.DATABASE_URL = 'postgresql://postgres:123456789@localhost:5432/languages';
```

#### 步骤4 - 运行导入脚本

```bash
cd languages
node scripts/import-translations-from-file.js path/to/import-data.json
```

### 注意事项

1. 确保在导入前已经启动了Docker容器
2. 确保PostgreSQL端口已正确映射
3. 如果PostgreSQL使用的是不同的端口，请相应地修改连接字符串
4. 导入后可能需要重启服务容器以清除缓存

## 最佳实践

1. **命名空间组织**：按功能或页面组织翻译，如'common'、'hero'、'features'、'pricing'、'footer'等。在实际项目中，我们通常为每个主要页面或功能组件创建单独的命名空间。

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

使用推荐的`replace`方法处理占位符，避免使用嵌套的t函数调用。

```tsx
// 推荐
t('welcome').replace('{name}', userName)

// 不推荐
t('welcome', { name: userName })
```

### 语言切换无效

1. 确保`setLocale`函数被正确调用
2. 检查浏览器控制台是否有错误
3. 验证新语言的翻译是否存在于数据库中

## 许可证

MIT
