// 更新数据库种子文件，添加包翻译数据
const fs = require('fs');
const path = require('path');

// 种子文件路径
const seedFilePath = path.join(__dirname, '..', 'prisma', 'seed.ts');

// 读取种子文件
let seedContent = fs.readFileSync(seedFilePath, 'utf8');

// 包翻译数据
const packageTranslations = {
  "zh-CN": {
    "package.3b0d107e-79aa-4958-9a08-dc168533239c.name": "基础套餐",
    "package.3b0d107e-79aa-4958-9a08-dc168533239c.description": "获取250积分，满足基本AI图像生成需求",
    "package.a7e34027-b351-47cc-91e6-733f140ac675.name": "标准套餐",
    "package.a7e34027-b351-47cc-91e6-733f140ac675.description": "获取600积分，生成更多AI图像",
    "package.c130ec51-090a-4db3-bf27-ddc26fb33c7d.name": "高级套餐",
    "package.c130ec51-090a-4db3-bf27-ddc26fb33c7d.description": "获取1500积分，满足大量AI图像生成需求"
  },
  "en": {
    "package.3b0d107e-79aa-4958-9a08-dc168533239c.name": "Basic Package",
    "package.3b0d107e-79aa-4958-9a08-dc168533239c.description": "Get 250 points for basic AI image generation",
    "package.a7e34027-b351-47cc-91e6-733f140ac675.name": "Standard Package",
    "package.a7e34027-b351-47cc-91e6-733f140ac675.description": "Get 600 points for more AI image generation",
    "package.c130ec51-090a-4db3-bf27-ddc26fb33c7d.name": "Premium Package",
    "package.c130ec51-090a-4db3-bf27-ddc26fb33c7d.description": "Get 1500 points for extensive AI image generation"
  }
};

// 查找 userPoints 命名空间在种子文件中的位置
const userPointsNamespaceRegex = /"name": "userPoints",\s*"translations": \{/;
const match = seedContent.match(userPointsNamespaceRegex);

if (match) {
  console.log('找到 userPoints 命名空间，更新翻译数据...');
  
  // 遍历每种语言
  for (const [locale, translations] of Object.entries(packageTranslations)) {
    // 查找该语言在 userPoints 命名空间中的位置
    const localeRegex = new RegExp(`"${locale}": \\{([\\s\\S]*?)\\}`, 'g');
    const localeMatch = localeRegex.exec(seedContent);
    
    if (localeMatch) {
      console.log(`找到 ${locale} 语言，更新翻译...`);
      
      // 提取现有翻译
      let existingTranslations = localeMatch[1];
      
      // 添加新的包翻译
      let newTranslations = existingTranslations;
      for (const [key, value] of Object.entries(translations)) {
        // 检查翻译键是否已存在
        const keyRegex = new RegExp(`"${key.replace(/\./g, '\\.')}": "[^"]*"`);
        if (keyRegex.test(newTranslations)) {
          // 更新现有翻译
          newTranslations = newTranslations.replace(keyRegex, `"${key}": "${value}"`);
        } else {
          // 添加新翻译
          newTranslations += `,\n          "${key}": "${value}"`;
        }
      }
      
      // 更新种子文件内容
      seedContent = seedContent.replace(existingTranslations, newTranslations);
    } else {
      console.log(`未找到 ${locale} 语言，添加新的语言部分...`);
      
      // 构建新的语言部分
      let newLocaleSection = `"${locale}": {\n`;
      for (const [key, value] of Object.entries(translations)) {
        newLocaleSection += `          "${key}": "${value}",\n`;
      }
      newLocaleSection += '        }';
      
      // 在 userPoints 命名空间中添加新的语言部分
      const insertPosition = match.index + match[0].length;
      seedContent = seedContent.slice(0, insertPosition) + '\n        ' + newLocaleSection + ',' + seedContent.slice(insertPosition);
    }
  }
  
  // 写入更新后的种子文件
  fs.writeFileSync(seedFilePath, seedContent, 'utf8');
  console.log('种子文件更新成功！');
} else {
  console.log('未找到 userPoints 命名空间，检查是否需要添加新的命名空间...');
  
  // 查找命名空间数组在种子文件中的位置
  const namespacesArrayRegex = /"namespaces": \[/;
  const namespacesMatch = seedContent.match(namespacesArrayRegex);
  
  if (namespacesMatch) {
    console.log('找到命名空间数组，添加 userPoints 命名空间...');
    
    // 构建 userPoints 命名空间
    let userPointsNamespace = '    {\n';
    userPointsNamespace += '      "name": "userPoints",\n';
    userPointsNamespace += '      "translations": {\n';
    
    // 添加每种语言的翻译
    for (const [locale, translations] of Object.entries(packageTranslations)) {
      userPointsNamespace += `        "${locale}": {\n`;
      
      // 添加每个翻译键
      for (const [key, value] of Object.entries(translations)) {
        userPointsNamespace += `          "${key}": "${value}",\n`;
      }
      
      userPointsNamespace += '        },\n';
    }
    
    userPointsNamespace += '      }\n';
    userPointsNamespace += '    },';
    
    // 在命名空间数组中添加 userPoints 命名空间
    const insertPosition = namespacesMatch.index + namespacesMatch[0].length;
    seedContent = seedContent.slice(0, insertPosition) + '\n' + userPointsNamespace + seedContent.slice(insertPosition);
    
    // 写入更新后的种子文件
    fs.writeFileSync(seedFilePath, seedContent, 'utf8');
    console.log('种子文件更新成功！');
  } else {
    console.error('未找到命名空间数组，无法更新种子文件！');
  }
}
