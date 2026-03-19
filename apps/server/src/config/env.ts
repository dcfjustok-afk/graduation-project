import dotenv from "dotenv";

dotenv.config();

/**
 * 后端服务环境变量配置。
 *
 * 这里集中处理所有运行时配置，目的是：
 * 1. 让入口文件保持整洁；
 * 2. 方便后续新增数据库、区块链 RPC、私钥等配置；
 * 3. 让论文说明时能明确指出“系统配置统一由配置模块管理”。
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3010),
  serviceName: "graduation-project-server",
  sqliteDbPath:
    process.env.SQLITE_DB_PATH || "../../storage/sqlite/graduation-project.db",
  hardhatRpcUrl: process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545",
  logRegistryAddress: process.env.LOG_REGISTRY_ADDRESS || "",
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || "",
};