// 导入实际包 ID 的翻译数据
const { PrismaClient } = require('@prisma/client');

// 设置数据库连接
process.env.DATABASE_URL = 'postgresql://postgres:123456789@localhost:5432/language_service';

const prisma = new PrismaClient();

// 项目ID
const PROJECT_ID = '83a645a7-cf3b-4458-a75e-18723cf730e7';

// 实际的包 ID（从截图中获取）
const actualPackages = [
  {
    id: '3b0d107e-79aa-4958-9a08-dc168533239c',
    name: '基础套餐',
    description: '获取250积分，满足基本AI图像生成需求',
    points: 250,
    price: 22.90
  },
  {
    id: 'a7e34027-b351-47cc-91e6-733f140ac675',
    name: '标准套餐',
    description: '获取600积分，生成更多AI图像',
    points: 600,
    price: 49.90
  },
  {
    id: 'c130ec51-090a-4db3-bf27-ddc26fb33c7d',
    name: '高级套餐',
    description: '获取1500积分，满足大量AI图像生成需求',
    points: 1500,
    price: 119.90
  }
];

// 导入包翻译数据
async function importActualPackageTranslations() {
  try {
    console.log('开始导入实际包 ID 的翻译数据...');
    
    // 获取项目信息
    const project = await prisma.project.findUnique({
      where: { id: PROJECT_ID },
    });
    
    if (!project) {
      throw new Error(`找不到项目ID: ${PROJECT_ID}`);
    }
    
    console.log(`找到项目: ${project.name} (${project.id})`);
    
    // 查找或创建 userPoints 命名空间
    let namespace = await prisma.namespace.findFirst({
      where: {
        name: 'userPoints',
        projectId: project.id,
      },
    });
    
    if (!namespace) {
      namespace = await prisma.namespace.create({
        data: {
          name: 'userPoints',
          projectId: project.id,
        },
      });
      console.log(`创建命名空间: userPoints`);
    } else {
      console.log(`找到命名空间: userPoints (${namespace.id})`);
    }
    
    // 导入实际包数据的翻译
    for (const pkg of actualPackages) {
      console.log(`处理包: ${pkg.id} - ${pkg.name}`);
      
      // 中文翻译
      await upsertTranslation(namespace.id, 'zh-CN', `package.${pkg.id}.name`, pkg.name);
      await upsertTranslation(namespace.id, 'zh-CN', `package.${pkg.id}.description`, pkg.description);
      
      // 英文翻译
      const englishName = getEnglishName(pkg.name);
      const englishDescription = getEnglishDescription(pkg.description, pkg.points);
      
      await upsertTranslation(namespace.id, 'en', `package.${pkg.id}.name`, englishName);
      await upsertTranslation(namespace.id, 'en', `package.${pkg.id}.description`, englishDescription);
    }
    
    console.log('实际包 ID 的翻译数据导入完成！');
  } catch (error) {
    console.error('导入实际包 ID 的翻译数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 创建或更新翻译
async function upsertTranslation(namespaceId, locale, key, value) {
  // 查找现有翻译
  const existingTranslation = await prisma.translation.findFirst({
    where: {
      namespaceId,
      locale,
      key,
    },
  });
  
  if (existingTranslation) {
    // 更新现有翻译
    await prisma.translation.update({
      where: { id: existingTranslation.id },
      data: { value },
    });
    console.log(`  更新翻译: ${key} (${locale}) = ${value}`);
  } else {
    // 创建新翻译
    await prisma.translation.create({
      data: {
        key,
        value,
        locale,
        namespaceId,
      },
    });
    console.log(`  创建翻译: ${key} (${locale}) = ${value}`);
  }
}

// 获取英文名称
function getEnglishName(chineseName) {
  const nameMap = {
    '基础套餐': 'Basic Package',
    '入门套餐': 'Starter Package',
    '标准套餐': 'Standard Package',
    '高级套餐': 'Premium Package',
    '超值套餐': 'Value Package',
    '专业套餐': 'Professional Package',
    '企业套餐': 'Enterprise Package',
    '旗舰套餐': 'Flagship Package',
    '月度订阅': 'Monthly Subscription',
    '年度订阅': 'Annual Subscription',
    '限时特惠': 'Limited Time Offer',
    '新用户礼包': 'New User Gift'
  };
  
  return nameMap[chineseName] || 'Package';
}

// 获取英文描述
function getEnglishDescription(chineseDescription, points) {
  if (chineseDescription.includes('获取') && chineseDescription.includes('积分')) {
    return `Get ${points} points for AI image generation`;
  }
  
  const descriptionMap = {
    '适合初次尝试的用户，提供基本的AI图像生成功能。': 'Perfect for first-time users, providing basic AI image generation functionality.',
    '适合中度使用者，提供更多的图像生成额度。': 'Suitable for moderate users, offering more image generation quota.',
    '为重度用户提供的大容量套餐，享受更多优惠。': 'High-capacity package for heavy users with more benefits.',
    '最具性价比的选择，提供大量积分满足您的创作需求。': 'Most cost-effective choice, providing a large number of points for your creative needs.',
    '获取250积分，满足基本AI图像生成需求': 'Get 250 points for basic AI image generation needs',
    '获取600积分，生成更多AI图像': 'Get 600 points for more AI image generation',
    '获取1500积分，满足大量AI图像生成需求': 'Get 1500 points for extensive AI image generation'
  };
  
  return descriptionMap[chineseDescription] || `Get ${points} points for AI image generation`;
}

// 执行导入
importActualPackageTranslations();
