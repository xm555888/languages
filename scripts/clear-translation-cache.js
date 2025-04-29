// 清除翻译缓存
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

// 设置数据库连接
process.env.DATABASE_URL = 'postgresql://postgres:123456789@localhost:5432/language_service';

const prisma = new PrismaClient();

async function clearTranslationCache() {
  try {
    console.log('开始清除翻译缓存...');
    
    // 连接到 Redis
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // 查找所有与翻译相关的缓存键
    const keys = await redis.keys('translation:*');
    
    console.log(`找到 ${keys.length} 个翻译缓存键`);
    
    if (keys.length > 0) {
      // 删除所有翻译缓存
      const result = await redis.del(...keys);
      console.log(`成功删除 ${result} 个翻译缓存键`);
    }
    
    console.log('翻译缓存清除完成');
    
    // 关闭 Redis 连接
    await redis.quit();
  } catch (error) {
    console.error('清除翻译缓存时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清除
clearTranslationCache();
