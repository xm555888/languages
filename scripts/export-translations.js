// 导出翻译数据工具
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// 设置数据库连接
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:123456789@localhost:5432/language_service';

const prisma = new PrismaClient();

// 导出项目的所有翻译数据
async function exportTranslations(projectId) {
  try {
    console.log(`开始导出项目 ${projectId} 的翻译数据...`);

    // 获取项目信息
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        namespaces: true,
      },
    });

    if (!project) {
      throw new Error(`找不到项目: ${projectId}`);
    }

    console.log(`找到项目: ${project.name} (${project.id})`);

    // 获取所有语言
    const locales = await prisma.locale.findMany({
      where: { isActive: true },
    });

    console.log(`找到 ${locales.length} 种语言`);

    // 创建导出数据结构
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        apiKey: project.apiKey,
        description: project.description,
      },
      locales: locales.map(locale => ({
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        isDefault: locale.isDefault,
      })),
      namespaces: [],
    };

    // 获取每个命名空间的翻译数据
    for (const namespace of project.namespaces) {
      console.log(`处理命名空间: ${namespace.name}`);

      const translations = await prisma.translation.findMany({
        where: {
          namespaceId: namespace.id,
        },
      });

      // 按语言组织翻译数据
      const translationsByLocale = {};
      
      for (const translation of translations) {
        if (!translationsByLocale[translation.locale]) {
          translationsByLocale[translation.locale] = {};
        }
        
        translationsByLocale[translation.locale][translation.key] = translation.value;
      }

      exportData.namespaces.push({
        name: namespace.name,
        translations: translationsByLocale,
      });

      console.log(`  命名空间 ${namespace.name} 包含 ${translations.length} 条翻译`);
    }

    // 创建导出目录
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // 生成导出文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `translations_${project.name.replace(/\s+/g, '_')}_${timestamp}.json`;
    const exportFilePath = path.join(exportDir, exportFileName);

    // 写入文件
    fs.writeFileSync(
      exportFilePath,
      JSON.stringify(exportData, null, 2),
      'utf8'
    );

    console.log(`翻译数据已导出到: ${exportFilePath}`);
    return exportFilePath;
  } catch (error) {
    console.error('导出翻译数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行脚本，则使用命令行参数
if (require.main === module) {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const projectId = args[0] || '83a645a7-cf3b-4458-a75e-18723cf730e7'; // 默认使用ImagerAI项目ID

  exportTranslations(projectId)
    .then(filePath => {
      console.log(`导出完成: ${filePath}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('导出失败:', err);
      process.exit(1);
    });
} else {
  // 作为模块导出
  module.exports = { exportTranslations };
}
