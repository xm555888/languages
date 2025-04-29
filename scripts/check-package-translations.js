// 检查包翻译数据
const { PrismaClient } = require('@prisma/client');

// 设置数据库连接
process.env.DATABASE_URL = 'postgresql://postgres:123456789@localhost:5432/language_service';

const prisma = new PrismaClient();

async function checkPackageTranslations() {
  try {
    console.log('检查包翻译数据...');
    
    // 查找 userPoints 命名空间
    const namespace = await prisma.namespace.findFirst({
      where: { name: 'userPoints' },
    });
    
    if (!namespace) {
      console.log('找不到 userPoints 命名空间');
      return;
    }
    
    console.log(`找到 userPoints 命名空间: ${namespace.id}`);
    
    // 查询包相关的翻译数据
    const packageTranslations = await prisma.translation.findMany({
      where: {
        namespaceId: namespace.id,
        key: {
          startsWith: 'package.',
        },
      },
      orderBy: {
        key: 'asc',
      },
    });
    
    console.log(`找到 ${packageTranslations.length} 条包相关的翻译数据:`);
    
    // 按包ID组织翻译
    const translationsByPackage = {};
    
    for (const translation of packageTranslations) {
      // 从键中提取包ID
      const match = translation.key.match(/^package\.([^.]+)\.(.+)$/);
      
      if (match) {
        const [, packageId, property] = match;
        
        if (!translationsByPackage[packageId]) {
          translationsByPackage[packageId] = {};
        }
        
        if (!translationsByPackage[packageId][translation.locale]) {
          translationsByPackage[packageId][translation.locale] = {};
        }
        
        translationsByPackage[packageId][translation.locale][property] = translation.value;
      }
    }
    
    // 打印按包ID组织的翻译数据
    console.log('按包ID组织的翻译数据:');
    console.log(JSON.stringify(translationsByPackage, null, 2));
  } catch (error) {
    console.error('检查包翻译数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行检查
checkPackageTranslations();
