// 从JSON文件导入翻译数据工具
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 设置数据库连接
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:123456789@localhost:5432/language_service';

const prisma = new PrismaClient();

// 从JSON文件导入翻译数据
async function importTranslationsFromFile(filePath, options = {}) {
  const {
    createProject = true,
    createLocales = true,
    overwriteExisting = true,
  } = options;

  try {
    console.log(`开始从文件导入翻译数据: ${filePath}`);

    // 读取JSON文件
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileContent);

    // 验证导入数据格式
    if (!importData.project || !importData.locales || !importData.namespaces) {
      throw new Error('导入文件格式无效，缺少必要的数据结构');
    }

    // 处理项目
    let project;
    if (createProject) {
      // 检查项目是否已存在
      project = await prisma.project.findUnique({
        where: { id: importData.project.id },
      });

      if (project) {
        console.log(`项目已存在: ${project.name} (${project.id})`);
        
        // 更新项目信息
        if (overwriteExisting) {
          project = await prisma.project.update({
            where: { id: project.id },
            data: {
              name: importData.project.name,
              description: importData.project.description,
              apiKey: importData.project.apiKey,
            },
          });
          console.log(`已更新项目信息`);
        }
      } else {
        // 创建新项目
        project = await prisma.project.create({
          data: {
            id: importData.project.id,
            name: importData.project.name,
            description: importData.project.description,
            apiKey: importData.project.apiKey,
          },
        });
        console.log(`已创建新项目: ${project.name} (${project.id})`);
      }
    } else {
      // 使用现有项目
      project = await prisma.project.findUnique({
        where: { id: importData.project.id },
      });

      if (!project) {
        throw new Error(`找不到项目: ${importData.project.id}`);
      }
      console.log(`使用现有项目: ${project.name} (${project.id})`);
    }

    // 处理语言
    if (createLocales) {
      for (const localeData of importData.locales) {
        // 检查语言是否已存在
        let locale = await prisma.locale.findUnique({
          where: { code: localeData.code },
        });

        if (locale) {
          console.log(`语言已存在: ${locale.name} (${locale.code})`);
          
          // 更新语言信息
          if (overwriteExisting) {
            locale = await prisma.locale.update({
              where: { code: locale.code },
              data: {
                name: localeData.name,
                nativeName: localeData.nativeName,
                isDefault: localeData.isDefault,
              },
            });
            console.log(`已更新语言信息: ${locale.code}`);
          }
        } else {
          // 创建新语言
          locale = await prisma.locale.create({
            data: {
              code: localeData.code,
              name: localeData.name,
              nativeName: localeData.nativeName,
              isDefault: localeData.isDefault,
              isActive: true,
            },
          });
          console.log(`已创建新语言: ${locale.name} (${locale.code})`);
        }
      }
    } else {
      console.log('跳过语言创建，使用现有语言');
    }

    // 处理命名空间和翻译
    let totalTranslations = 0;
    let createdTranslations = 0;
    let updatedTranslations = 0;
    let skippedTranslations = 0;

    for (const namespaceData of importData.namespaces) {
      console.log(`处理命名空间: ${namespaceData.name}`);

      // 检查命名空间是否已存在
      let namespace = await prisma.namespace.findFirst({
        where: {
          name: namespaceData.name,
          projectId: project.id,
        },
      });

      if (!namespace) {
        // 创建新命名空间
        namespace = await prisma.namespace.create({
          data: {
            name: namespaceData.name,
            projectId: project.id,
          },
        });
        console.log(`已创建新命名空间: ${namespace.name}`);
      }

      // 处理翻译
      for (const [localeCode, translations] of Object.entries(namespaceData.translations)) {
        console.log(`  处理语言: ${localeCode}`);

        // 确保语言存在
        const locale = await prisma.locale.findUnique({
          where: { code: localeCode },
        });

        if (!locale) {
          console.log(`  警告: 找不到语言 ${localeCode}，跳过`);
          continue;
        }

        // 遍历该语言下的所有翻译键
        for (const [key, value] of Object.entries(translations)) {
          totalTranslations++;

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
            if (overwriteExisting) {
              await prisma.translation.update({
                where: { id: existingTranslation.id },
                data: { value },
              });
              updatedTranslations++;
            } else {
              skippedTranslations++;
            }
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
            createdTranslations++;
          }
        }
      }
    }

    console.log('\n导入统计:');
    console.log(`总翻译数: ${totalTranslations}`);
    console.log(`新建翻译: ${createdTranslations}`);
    console.log(`更新翻译: ${updatedTranslations}`);
    console.log(`跳过翻译: ${skippedTranslations}`);
    console.log('\n翻译数据导入完成！');

    return {
      totalTranslations,
      createdTranslations,
      updatedTranslations,
      skippedTranslations,
    };
  } catch (error) {
    console.error('导入翻译数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 交互式命令行界面
async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    // 获取文件路径
    let filePath = await question('请输入翻译数据文件路径 (默认: ../exports/最新文件): ');
    
    if (!filePath) {
      // 查找最新的导出文件
      const exportDir = path.join(__dirname, '../exports');
      if (fs.existsSync(exportDir)) {
        const files = fs.readdirSync(exportDir)
          .filter(file => file.startsWith('translations_') && file.endsWith('.json'))
          .map(file => ({
            name: file,
            path: path.join(exportDir, file),
            time: fs.statSync(path.join(exportDir, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);
        
        if (files.length > 0) {
          filePath = files[0].path;
          console.log(`使用最新的导出文件: ${files[0].name}`);
        }
      }
    }

    if (!filePath) {
      throw new Error('未指定文件路径，且找不到默认文件');
    }

    // 确认文件存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 获取导入选项
    const createProject = (await question('是否创建/更新项目? (Y/n): ')).toLowerCase() !== 'n';
    const createLocales = (await question('是否创建/更新语言? (Y/n): ')).toLowerCase() !== 'n';
    const overwriteExisting = (await question('是否覆盖现有翻译? (Y/n): ')).toLowerCase() !== 'n';

    // 执行导入
    await importTranslationsFromFile(filePath, {
      createProject,
      createLocales,
      overwriteExisting,
    });

    console.log('导入完成!');
  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    rl.close();
  }
}

// 如果直接运行脚本，则使用命令行参数或交互式界面
if (require.main === module) {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const filePath = args[0];

  if (filePath) {
    // 使用命令行参数
    importTranslationsFromFile(filePath)
      .then(() => {
        console.log('导入完成!');
        process.exit(0);
      })
      .catch(err => {
        console.error('导入失败:', err);
        process.exit(1);
      });
  } else {
    // 使用交互式界面
    runInteractive()
      .then(() => process.exit(0))
      .catch(err => {
        console.error('导入失败:', err);
        process.exit(1);
      });
  }
} else {
  // 作为模块导出
  module.exports = { importTranslationsFromFile };
}
