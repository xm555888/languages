import { buildApp } from './app';
import { SERVER } from './config';

// 启动服务器
async function startServer() {
  const app = buildApp();

  try {
    await app.listen({
      port: SERVER.PORT,
      host: SERVER.HOST,
    });

    console.log(`服务器运行在 http://${SERVER.HOST}:${SERVER.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 启动服务器
startServer();
