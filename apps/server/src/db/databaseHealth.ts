import fs from "node:fs";
import { getConfiguredDatabasePath } from "./sqliteClient";

/**
 * 返回数据库健康状态。
 *
 * 当前版本先用“数据库文件是否存在”作为最小健康指标，
 * 后续可以继续扩展为：
 * - 能否成功连接数据库
 * - 核心表是否齐全
 * - 最近一次初始化时间
 */
export function getDatabaseHealthStatus() {
  const databasePath = getConfiguredDatabasePath();

  return fs.existsSync(databasePath)
    ? {
        status: "ready",
        databasePath,
      }
    : {
        status: "not_initialized",
        databasePath,
      };
}