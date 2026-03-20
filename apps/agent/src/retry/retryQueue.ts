import { env } from "../config/env";
import { submitLogToServer, syncAgentStateToServer } from "../http/logApiClient";
import { loadOffsetState, saveOffsetState } from "../state/offsetStore";
import { AgentStateSyncPayload, LogSubmitPayload, PendingLogRecord } from "../types/agent";
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

function buildAgentStatePayload(status: NonNullable<AgentStateSyncPayload["status"]>, errorMessage?: string | null): AgentStateSyncPayload {
  const state = loadOffsetState();

  return {
    agentName: state.agentName,
    sourcePath: state.sourcePath,
    lastOffset: state.lastOffset,
    lastHeartbeatAt: state.lastHeartbeatAt,
    lastSyncAt: state.lastSyncAt,
    status,
    errorMessage: errorMessage || null,
  };
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

  try {
    await syncAgentStateToServer(buildAgentStatePayload(remaining.length > 0 ? "retrying" : "running"));
  } catch (error) {
    logError("Agent 状态同步失败", error);
  }
}

export async function reportAgentError(error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";

  try {
    await syncAgentStateToServer(buildAgentStatePayload("error", message));
  } catch (syncError) {
    logError("Agent 错误状态同步失败", syncError);
  }
}