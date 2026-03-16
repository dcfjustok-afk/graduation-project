import { env } from "../config/env";
import { submitLogToServer } from "../http/logApiClient";
import { loadOffsetState, saveOffsetState } from "../state/offsetStore";
import { LogSubmitPayload, PendingLogRecord } from "../types/agent";
import { logError, logInfo } from "../utils/logger";

function toPayload(record: PendingLogRecord): LogSubmitPayload {
  return {
    taskId: env.taskId,
    sourceType: "agent",
    sourcePath: env.logFilePath,
    logContent: record.logContent,
    logLevel: env.defaultLogLevel,
    collectedAt: record.collectedAt,
  };
}

function calculateNextRetryTime(retryCount: number) {
  return Date.now() + env.retryIntervalMs * Math.max(1, retryCount);
}

export async function flushPendingQueue() {
  const state = loadOffsetState();
  const now = Date.now();
  const remaining: PendingLogRecord[] = [];

  for (const item of state.pendingQueue) {
    if (item.nextRetryAt > now) {
      remaining.push(item);
      continue;
    }

    try {
      await submitLogToServer(toPayload(item));
      logInfo(`日志上报成功，队列项 ${item.id}`);
    } catch (error) {
      const retryCount = item.retryCount + 1;

      if (retryCount > env.maxRetryTimes) {
        logError(`日志上报超过最大重试次数，丢弃队列项 ${item.id}`, error);
        continue;
      }

      remaining.push({
        ...item,
        retryCount,
        nextRetryAt: calculateNextRetryTime(retryCount),
      });

      logError(`日志上报失败，将进入第 ${retryCount} 次重试`, error);
    }
  }

  state.pendingQueue = remaining;
  state.lastSyncAt = new Date().toISOString();
  state.lastHeartbeatAt = new Date().toISOString();
  saveOffsetState(state);
}