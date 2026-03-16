import { env } from "../config/env";
import { getDatabaseHealthStatus } from "../db/databaseHealth";

/**
 * 健康检查服务。
 *
 * 当前职责保持简单：
 * - 告诉前端或调用方“服务是否活着”；
 * - 返回最基础的运行信息；
 * - 为后续增加数据库状态、区块链连接状态预留扩展点。
 */
export function getHealthStatus() {
  return {
    service: env.serviceName,
    status: "ok",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    dependencies: {
      database: getDatabaseHealthStatus(),
      blockchain: "pending",
    },
  };
}