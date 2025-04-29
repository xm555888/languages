// scripts/wait-for-postgres.js
const { Client } = require('pg');

// 获取数据库URL
const dbUrl = process.env.LANGUAGE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:123456789@postgres:5432/languages?schema=public';

const maxRetries = 20;
const retryInterval = 3000; // 3秒

async function waitForPostgres() {
  console.log('等待PostgreSQL启动...');
  console.log(`数据库URL: ${dbUrl}`);
  
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const client = new Client({
        connectionString: dbUrl,
      });
      
      await client.connect();
      console.log('PostgreSQL已准备好接受连接！');
      await client.end();
      return true;
    } catch (error) {
      console.log(`尝试连接PostgreSQL失败 (${retries + 1}/${maxRetries}): ${error.message}`);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('达到最大重试次数，无法连接到PostgreSQL');
        return false;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  return false;
}

// 直接执行脚本
waitForPostgres()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('等待PostgreSQL时发生错误:', error);
    process.exit(1);
  });
