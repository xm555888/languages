/**
 * 从数据库导出翻译数据并生成seed.js和seed.ts文件
 * 使用方法: node scripts/generate-translation-seeds.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 种子文件模板 - JS版本
const seedJsTemplate = `// 这是自动生成的Prisma种子脚本，用于初始化ImagerAI的翻译数据
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始初始化ImagerAI翻译数据...');

    // 1. 创建项目
    console.log('创建项目...');
    {{PROJECT_UPSERT}}

    // 2. 创建语言
    console.log('创建语言...');
    {{LOCALE_UPSERTS}}

    // 3. 创建命名空间
    console.log('创建命名空间...');
    {{NAMESPACE_UPSERTS}}

    // 4. 创建翻译数据
    console.log('创建翻译数据...');
    {{TRANSLATION_BATCH_LOGS}}
    {{TRANSLATION_UPSERTS}}

    console.log('ImagerAI翻译数据初始化完成！');
  } catch (error) {
    console.error('初始化ImagerAI翻译数据失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
`;

// 种子文件模板 - TS版本
const seedTsTemplate = `// 这是自动生成的Prisma种子脚本，用于初始化ImagerAI的翻译数据
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始初始化ImagerAI翻译数据...');

    // 1. 创建项目
    console.log('创建项目...');
    {{PROJECT_UPSERT}}

    // 2. 创建语言
    console.log('创建语言...');
    {{LOCALE_UPSERTS}}

    // 3. 创建命名空间
    console.log('创建命名空间...');
    {{NAMESPACE_UPSERTS}}

    // 4. 创建翻译数据
    console.log('创建翻译数据...');
    {{TRANSLATION_BATCH_LOGS}}
    {{TRANSLATION_UPSERTS}}

    console.log('ImagerAI翻译数据初始化完成！');
  } catch (error) {
    console.error('初始化ImagerAI翻译数据失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
`;

// 格式化日期对象为字符串
function formatDate(date) {
  return date.toISOString();
}

// 生成项目upsert代码
async function generateProjectUpsert() {
  const project = await prisma.project.findFirst();
  if (!project) {
    throw new Error('未找到项目数据');
  }

  return `await prisma.project.upsert({
      where: { id: "${project.id}" },
      update: {
        name: "${project.name}",
        description: "${project.description || ''}",
        apiKey: "${project.apiKey}",
        isActive: ${project.isActive},
        updatedAt: new Date("${formatDate(project.updatedAt)}")
      },
      create: {
        id: "${project.id}",
        name: "${project.name}",
        description: "${project.description || ''}",
        apiKey: "${project.apiKey}",
        isActive: ${project.isActive},
        createdAt: new Date("${formatDate(project.createdAt)}"),
        updatedAt: new Date("${formatDate(project.updatedAt)}")
      }
    });`;
}

// 生成语言upsert代码
async function generateLocaleUpserts() {
  const locales = await prisma.locale.findMany();
  if (locales.length === 0) {
    throw new Error('未找到语言数据');
  }

  return locales.map(locale => `await prisma.locale.upsert({
      where: { code: "${locale.code}" },
      update: {
        name: "${locale.name}",
        nativeName: "${locale.nativeName}",
        isActive: ${locale.isActive},
        isDefault: ${locale.isDefault},
        updatedAt: new Date("${formatDate(locale.updatedAt)}")
      },
      create: {
        code: "${locale.code}",
        name: "${locale.name}",
        nativeName: "${locale.nativeName}",
        isActive: ${locale.isActive},
        isDefault: ${locale.isDefault},
        createdAt: new Date("${formatDate(locale.createdAt)}"),
        updatedAt: new Date("${formatDate(locale.updatedAt)}")
      }
    });`).join('\n\n    ');
}

// 生成命名空间upsert代码
async function generateNamespaceUpserts() {
  const namespaces = await prisma.namespace.findMany();
  if (namespaces.length === 0) {
    throw new Error('未找到命名空间数据');
  }

  return namespaces.map(namespace => `await prisma.namespace.upsert({
      where: { id: "${namespace.id}" },
      update: {
        name: "${namespace.name}",
        description: "${namespace.description || ''}",
        projectId: "${namespace.projectId}",
        updatedAt: new Date("${formatDate(namespace.updatedAt)}")
      },
      create: {
        id: "${namespace.id}",
        name: "${namespace.name}",
        description: "${namespace.description || ''}",
        projectId: "${namespace.projectId}",
        createdAt: new Date("${formatDate(namespace.createdAt)}"),
        updatedAt: new Date("${formatDate(namespace.updatedAt)}")
      }
    });`).join('\n\n    ');
}

// 生成翻译upsert代码
async function generateTranslationUpserts() {
  const translations = await prisma.translation.findMany({
    orderBy: { id: 'asc' }
  });
  
  if (translations.length === 0) {
    throw new Error('未找到翻译数据');
  }

  // 生成批次日志
  const batchSize = 100;
  const batchCount = Math.ceil(translations.length / batchSize);
  const batchLogs = Array.from({ length: batchCount }, (_, i) => 
    `console.log('导入翻译批次 ${i + 1}/${batchCount}...');`
  ).join('\n    ');

  // 生成翻译upsert代码
  let upsertCode = '';
  let currentBatch = 1;
  
  for (let i = 0; i < translations.length; i++) {
    const translation = translations[i];
    
    // 每个批次的开始添加批次注释
    if (i % batchSize === 0 && i > 0) {
      currentBatch++;
      upsertCode += `\n    // 批次 ${currentBatch}/${batchCount}\n    console.log('导入翻译批次 ${currentBatch}/${batchCount}...');\n    `;
    }
    
    // 转义特殊字符
    const value = translation.value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    
    const description = (translation.description || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    
    upsertCode += `await prisma.translation.upsert({
      where: { id: "${translation.id}" },
      update: {
        key: "${translation.key}",
        value: "${value}",
        locale: "${translation.locale}",
        description: "${description}",
        namespaceId: "${translation.namespaceId}",
        updatedAt: new Date("${formatDate(translation.updatedAt)}")
      },
      create: {
        id: "${translation.id}",
        key: "${translation.key}",
        value: "${value}",
        locale: "${translation.locale}",
        description: "${description}",
        namespaceId: "${translation.namespaceId}",
        createdAt: new Date("${formatDate(translation.createdAt)}"),
        updatedAt: new Date("${formatDate(translation.updatedAt)}")
      }
    });\n\n    `;
  }

  return { batchLogs, upsertCode };
}

// 主函数
async function main() {
  try {
    console.log('开始从数据库导出翻译数据...');
    
    // 生成项目upsert代码
    const projectUpsert = await generateProjectUpsert();
    console.log('已生成项目upsert代码');
    
    // 生成语言upsert代码
    const localeUpserts = await generateLocaleUpserts();
    console.log('已生成语言upsert代码');
    
    // 生成命名空间upsert代码
    const namespaceUpserts = await generateNamespaceUpserts();
    console.log('已生成命名空间upsert代码');
    
    // 生成翻译upsert代码
    const { batchLogs, upsertCode } = await generateTranslationUpserts();
    console.log('已生成翻译upsert代码');
    
    // 替换模板中的占位符
    const seedJs = seedJsTemplate
      .replace('{{PROJECT_UPSERT}}', projectUpsert)
      .replace('{{LOCALE_UPSERTS}}', localeUpserts)
      .replace('{{NAMESPACE_UPSERTS}}', namespaceUpserts)
      .replace('{{TRANSLATION_BATCH_LOGS}}', batchLogs)
      .replace('{{TRANSLATION_UPSERTS}}', upsertCode);
    
    const seedTs = seedTsTemplate
      .replace('{{PROJECT_UPSERT}}', projectUpsert)
      .replace('{{LOCALE_UPSERTS}}', localeUpserts)
      .replace('{{NAMESPACE_UPSERTS}}', namespaceUpserts)
      .replace('{{TRANSLATION_BATCH_LOGS}}', batchLogs)
      .replace('{{TRANSLATION_UPSERTS}}', upsertCode);
    
    // 写入seed.js文件
    fs.writeFileSync(path.join(__dirname, '../prisma/seed.js'), seedJs);
    console.log('已生成seed.js文件');
    
    // 写入seed.ts文件
    fs.writeFileSync(path.join(__dirname, '../prisma/seed.ts'), seedTs);
    console.log('已生成seed.ts文件');
    
    console.log('翻译种子文件生成完成！');
  } catch (error) {
    console.error('生成翻译种子文件失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
