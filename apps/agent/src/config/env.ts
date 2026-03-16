import dotenv from "dotenv";
import path from "path";

dotenv.config();

const projectRoot = path.resolve(__dirname, "..", "..");

function resolveProjectFile(targetPath: string) {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(projectRoot, targetPath);
}

/**
 * Agent 运行配置。
 *
 * 这里把所有可变参数集中起来，方便：
 * 1. 后期答辩时讲清楚 Agent 如何被配置；
 * 2. 后续从“单文件 demo”扩展到“多文件采集”；
 * 3. 降低入口文件复杂度。
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  agentName: process.env.AGENT_NAME || "demo-agent",
  taskId: process.env.TASK_ID || "demo-task-001",
  logFilePath: resolveProjectFile(process.env.AGENT_LOG_FILE || "./logs/demo-agent.log"),
  stateFilePath: resolveProjectFile(process.env.AGENT_STATE_FILE || "./state/agent-state.json"),
  serverBaseUrl: process.env.SERVER_BASE_URL || "http://127.0.0.1:3010",
  serverLogEndpoint: process.env.SERVER_LOG_ENDPOINT || "/api/logs",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 1500),
  retryIntervalMs: Number(process.env.RETRY_INTERVAL_MS || 4000),
  maxRetryTimes: Number(process.env.MAX_RETRY_TIMES || 5),
  defaultLogLevel: process.env.LOG_LEVEL || "INFO",
};

export function getServerLogSubmitUrl() {
  return new URL(env.serverLogEndpoint, env.serverBaseUrl).toString();
}