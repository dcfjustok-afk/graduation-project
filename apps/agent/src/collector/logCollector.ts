import { env } from "../config/env";
import { readIncrementalLines } from "./fileReader";
import { loadOffsetState, saveOffsetState } from "../state/offsetStore";
import { PendingLogRecord } from "../types/agent";

export function collectNewLogRecords(): PendingLogRecord[] {
  const state = loadOffsetState();
  const readResult = readIncrementalLines(env.logFilePath, state.lastOffset);

  const queueItems = readResult.lines.map((line, index) => ({
    id: `${Date.now()}-${index}`,
    lineNumber: state.pendingQueue.length + index + 1,
    logContent: line,
    collectedAt: new Date().toISOString(),
    retryCount: 0,
    nextRetryAt: Date.now(),
  }));

  state.lastOffset = readResult.newOffset;
  state.lastHeartbeatAt = new Date().toISOString();
  state.pendingQueue = [...state.pendingQueue, ...queueItems];
  saveOffsetState(state);

  return queueItems;
}