import fs from "fs";
import { env } from "../config/env";
import { collectNewLogRecords } from "../collector/logCollector";
import { flushPendingQueue, reportAgentError } from "../retry/retryQueue";
import { loadOffsetState, saveOffsetState } from "../state/offsetStore";
import { ensureFileExists } from "../utils/fsHelpers";
import { logError, logInfo } from "../utils/logger";

/**
 * Agent 主流程：
 * 1. 确保日志文件和状态文件存在；
 * 2. 启动定时轮询；
 * 3. 发现新增日志后写入待发送队列；
 * 4. 尝试发送并在失败时重试；
 * 5. 将偏移量与队列持久化到本地。
 */
export function createLogAgent() {
  ensureFileExists(env.logFilePath);

  const state = loadOffsetState();
  state.lastHeartbeatAt = new Date().toISOString();
  saveOffsetState(state);

  let isRunning = false;

  async function tick() {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      if (!fs.existsSync(env.logFilePath)) {
        ensureFileExists(env.logFilePath);
      }

      const newRecords = collectNewLogRecords();

      if (newRecords.length > 0) {
        logInfo(`本轮新增日志 ${newRecords.length} 条，已写入待发送队列`);
      }

      await flushPendingQueue();
    } catch (error) {
      await reportAgentError(error);
      logError("Agent 轮询执行失败", error);
    } finally {
      isRunning = false;
    }
  }

  return {
    async start() {
      logInfo(`Agent ${env.agentName} 启动成功，监听文件：${env.logFilePath}`);
      logInfo(`日志将上报到：${env.serverBaseUrl}${env.serverLogEndpoint}`);

      await tick();
      const timer = setInterval(() => {
        void tick();
      }, env.pollIntervalMs);

      return () => clearInterval(timer);
    },
  };
}