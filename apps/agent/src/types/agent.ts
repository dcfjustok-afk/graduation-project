export interface OffsetState {
  agentName: string;
  sourcePath: string;
  lastOffset: number;
  lastSyncAt: string | null;
  lastHeartbeatAt: string | null;
  pendingQueue: PendingLogRecord[];
}

export interface PendingLogRecord {
  id: string;
  lineNumber: number;
  logContent: string;
  collectedAt: string;
  retryCount: number;
  nextRetryAt: number;
}

export interface LogSubmitPayload {
  taskId: string;
  sourceType: string;
  sourcePath: string;
  logContent: string;
  logLevel: string;
  collectedAt: string;
}