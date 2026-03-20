export type ApiErrorCode =
  | "validation_error"
  | "not_found"
  | "internal_error"
  | "invalid_log_id";

export type ApiSourceMode = "mock" | "real";
export type LogLevel = "INFO" | "WARN" | "ERROR";
export type AuditStatus = "passed" | "failed" | "pending";
export type AgentRunStatus = "idle" | "running" | "retrying" | "error";
export type ServerAlertSeverity = "high" | "medium" | "info";
export type ServerAlertStatus = "open" | "processing" | "ignored";
export type ServerLogStatus =
  | "collected"
  | "confirmed"
  | "failed"
  | "audit_passed"
  | "audit_failed"
  | "audit_pending";
export type ViewLogStatus = "已上链" | "待审计" | "审计通过" | "发现异常";
export type ViewAlertLevel = "高危" | "中危" | "提示";
export type ViewAlertStatus = "待处理" | "处理中" | "已忽略";

export interface ApiError {
  code: ApiErrorCode;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiError | null;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
  };
}

export interface LogSubmitPayload {
  taskId: string;
  sourceType?: string;
  sourcePath?: string;
  logContent: string;
  logLevel?: string;
  collectedAt?: string;
}

export interface LogGeneratePayload {
  count: number;
  intervalMs?: number;
  base: LogSubmitPayload;
  overrides?: Array<Partial<LogSubmitPayload>>;
}

export interface LogGenerateFailure {
  index: number;
  ok: false;
  error: string;
}

export interface LogGenerateResponseData {
  successCount: number;
  failures: LogGenerateFailure[];
  createdLogIds: number[];
  limits: {
    maxCount: number;
    minIntervalMs: number;
  };
}

export interface AgentStateSyncPayload {
  agentName: string;
  sourcePath?: string;
  lastOffset?: number;
  lastHeartbeatAt?: string | null;
  lastSyncAt?: string | null;
  status?: AgentRunStatus;
  errorMessage?: string | null;
}

export interface ServerHealthStatus {
  service: string;
  status: string;
  environment: string;
  timestamp: string;
  dependencies: {
    database: string;
    blockchain: string;
  };
}

export interface ServerOverviewStats {
  totalLogs: number;
  totalHashRecords: number;
  totalAuditRecords: number;
  totalAlerts: number;
  openAlerts: number;
  onlineAgents: number;
}

export interface ServerLogRecord {
  id: number;
  task_id: string;
  source_type: string;
  source_path: string | null;
  log_content: string;
  log_level: LogLevel;
  collected_at: string;
  created_at: string;
  updated_at: string;
  status: ServerLogStatus | string;
}

export interface ServerLogHashRecord {
  id: number;
  log_id: number;
  task_id: string;
  log_hash: string;
  chain_name: string;
  contract_address: string | null;
  transaction_hash: string | null;
  block_number: number | null;
  on_chain_status: string;
  created_at: string;
  updated_at: string;
}

export interface ServerAuditRecord {
  id: number;
  log_id: number | null;
  log_hash_record_id: number | null;
  audit_status: AuditStatus;
  expected_hash: string | null;
  actual_hash: string | null;
  audit_message: string | null;
  audited_at: string;
  created_at: string;
}

export interface ServerAlertRecord {
  id: number;
  alert_type: string;
  severity: ServerAlertSeverity | string;
  related_log_id: number | null;
  related_audit_id: number | null;
  title: string;
  description: string;
  status: ServerAlertStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface ServerAgentStateRecord {
  id: number;
  agent_name: string;
  source_path: string | null;
  last_offset: number;
  last_heartbeat_at: string | null;
  last_sync_at: string | null;
  status: AgentRunStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditExecutionResult {
  logId: number;
  taskId: string;
  expectedHash: string | null;
  actualHash: string;
  onChainHash: string | null;
  auditStatus: AuditStatus;
  auditMessage: string;
  alertGenerated: boolean;
}

export interface AuditTimelineEntry {
  color: "blue" | "green" | "red";
  content: string;
}

export interface OverviewCard {
  title: string;
  value: number;
  suffix: string;
  trend: string;
}

export interface LogRecord {
  id: string;
  taskName: string;
  source: string;
  level: LogLevel;
  status: ViewLogStatus;
  submittedAt: string;
  hash: string;
  auditMessage?: string;
  expectedHash?: string;
  actualHash?: string;
}

export interface AlertRecord {
  id: string;
  level: ViewAlertLevel;
  title: string;
  description: string;
  time: string;
  status: ViewAlertStatus;
}

export interface SystemModule {
  name: string;
  progress: number;
  description: string;
}

export interface AuditSummary {
  total: number;
  passed: number;
  warning: number;
  abnormal: number;
  pending: number;
}

export interface TrendPoint {
  label: string;
  total: number;
  abnormal: number;
}

export interface StatusDistributionItem {
  label: string;
  value: number;
  color: string;
}

export interface AlertDistributionItem {
  label: string;
  value: number;
  color: string;
}

export interface DashboardData {
  overviewCards: OverviewCard[];
  auditTimeline: AuditTimelineEntry[];
  systemModules: SystemModule[];
  auditSummary: AuditSummary;
  logTrend: TrendPoint[];
  statusDistribution: StatusDistributionItem[];
  alertDistribution: AlertDistributionItem[];
}

export interface DashboardViewData extends DashboardData {
  sourceMode: ApiSourceMode;
}

export interface LogSubmitResponseData {
  log: ServerLogRecord;
  hashRecord: ServerLogHashRecord;
  blockchainError: string | null;
}

export interface ProtocolValidationResult {
  valid: boolean;
  errors: string[];
}

export const ERROR_CODES: {
  VALIDATION_ERROR: "validation_error";
  NOT_FOUND: "not_found";
  INTERNAL_ERROR: "internal_error";
  INVALID_LOG_ID: "invalid_log_id";
};

export const API_SOURCE_MODES: {
  MOCK: "mock";
  REAL: "real";
};

export const LOG_LEVELS: {
  INFO: "INFO";
  WARN: "WARN";
  ERROR: "ERROR";
};

export const AUDIT_STATUSES: {
  PASSED: "passed";
  FAILED: "failed";
  PENDING: "pending";
};

export const AGENT_RUN_STATUSES: {
  IDLE: "idle";
  RUNNING: "running";
  RETRYING: "retrying";
  ERROR: "error";
};

export const SERVER_ALERT_SEVERITIES: {
  HIGH: "high";
  MEDIUM: "medium";
  INFO: "info";
};

export const SERVER_ALERT_STATUSES: {
  OPEN: "open";
  PROCESSING: "processing";
  IGNORED: "ignored";
};

export const VIEW_LOG_STATUSES: {
  CHAINED: "已上链";
  PENDING_AUDIT: "待审计";
  AUDIT_PASSED: "审计通过";
  ABNORMAL: "发现异常";
};

export const VIEW_ALERT_LEVELS: {
  HIGH: "高危";
  MEDIUM: "中危";
  INFO: "提示";
};

export const VIEW_ALERT_STATUSES: {
  OPEN: "待处理";
  PROCESSING: "处理中";
  IGNORED: "已忽略";
};

export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T>;
export function createErrorResponse(message: string, code?: ApiErrorCode, details?: unknown): ApiResponse<null>;
export function createListResponse<T>(message: string, data: T[]): ApiListResponse<T>;
export function validateLogSubmitPayload(payload: unknown): ProtocolValidationResult;
export function validateAgentStateSyncPayload(payload: unknown): ProtocolValidationResult;
