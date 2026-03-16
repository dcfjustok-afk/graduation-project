import { createApp } from "./app";
import { env } from "./config/env";
import { initializeDatabase } from "./db/initDatabase";

/**
 * 服务启动入口。
 *
 * 这一层的职责非常单一：
 * - 创建应用实例；
 * - 监听端口；
 * - 输出启动日志。
 */
async function bootstrap() {
  await initializeDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`[server] ${env.serviceName} is running at http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server bootstrap error]", error);
  process.exit(1);
});