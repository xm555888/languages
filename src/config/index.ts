import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 只加载language模块自己的.env文件
const languageEnvPath = path.resolve(__dirname, '../../.env');

// 加载language模块自己的.env文件
if (fs.existsSync(languageEnvPath)) {
  dotenv.config({ path: languageEnvPath });
  console.log('已加载language模块的.env文件');
} else {
  console.log('未找到language模块的.env文件，将使用默认配置');
}

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
