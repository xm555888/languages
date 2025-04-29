import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 尝试加载环境文件
// 首先尝试加载.env文件，如果不存在则尝试加载.env.example文件
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../.env.example')
];

let envLoaded = false;

// 尝试加载环境文件
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`已加载环境文件: ${envPath}`);
    envLoaded = true;
    break;
  }
}

// 如果没有找到任何环境文件，则使用环境变量或默认配置
if (!envLoaded) {
  console.log('未找到任何环境文件，将使用环境变量或默认配置');
}

// 检测当前运行环境
const isContainer = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
const environment = process.env.LANGUAGES_NODE_ENV || 'development';

console.log(`检测到运行环境: ${environment}`);
if (isContainer) console.log('检测到容器环境（Docker/Coolify）');

// 打印关键环境变量，帮助调试
console.log('环境变量配置:');
console.log(`- LANGUAGES_NODE_ENV: ${process.env.LANGUAGES_NODE_ENV || '未设置'}`);
console.log(`- LANGUAGES_PORT: ${process.env.LANGUAGES_PORT || '未设置'}`);
console.log(`- LANGUAGE_DATABASE_URL: ${process.env.LANGUAGE_DATABASE_URL ? '已设置' : '未设置'}`);
console.log(`- LANGUAGE_REDIS_URL: ${process.env.LANGUAGE_REDIS_URL ? '已设置' : '未设置'}`);

// 服务器配置
export const SERVER = {
  PORT: parseInt(process.env.LANGUAGES_PORT || '3100', 10),
  HOST: process.env.LANGUAGES_HOST || '0.0.0.0',
  NODE_ENV: process.env.LANGUAGES_NODE_ENV || 'development',
  IS_PRODUCTION: process.env.LANGUAGES_NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.LANGUAGES_NODE_ENV === 'development',
  IS_TEST: process.env.LANGUAGES_NODE_ENV === 'test',
};

// 数据库配置
export const DATABASE = {
  URL: process.env.LANGUAGE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:123456789@localhost:5432/language_service?schema=public',
};

// Redis配置
export const REDIS = {
  URL: process.env.LANGUAGE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  PASSWORD: process.env.LANGUAGE_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
  PREFIX: process.env.LANGUAGE_REDIS_PREFIX || process.env.REDIS_PREFIX || 'lang:',
  TTL: parseInt(process.env.LANGUAGE_REDIS_TTL || process.env.REDIS_TTL || '3600', 10), // 默认缓存1小时
};

// 安全配置
export const SECURITY = {
  API_RATE_LIMIT: parseInt(process.env.LANGUAGE_API_RATE_LIMIT || process.env.API_RATE_LIMIT || '100', 10),
  API_RATE_LIMIT_TIMEWINDOW: parseInt(process.env.LANGUAGE_API_RATE_LIMIT_TIMEWINDOW || process.env.API_RATE_LIMIT_TIMEWINDOW || '60000', 10),
  CORS_ORIGIN: process.env.LANGUAGE_CORS_ORIGIN || process.env.CORS_ORIGIN || '*',
};

// 日志配置
export const LOGGING = {
  LEVEL: process.env.LANGUAGE_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
};

// 导出所有配置
export default {
  SERVER,
  DATABASE,
  REDIS,
  SECURITY,
  LOGGING,
};
