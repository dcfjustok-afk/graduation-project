export type { AgentStateSyncPayload, LogSubmitPayload } from "@graduation-project/shared";

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