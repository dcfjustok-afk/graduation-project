export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

export interface AgentStateSyncPayload {
  agentName: string;
  sourcePath?: string;
  lastOffset?: number;
  lastHeartbeatAt?: string | null;
  lastSyncAt?: string | null;
  status?: string;
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
  log_level: string;
  collected_at: string;
  created_at: string;
  updated_at: string;
  status: string;
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
  audit_status: string;
  expected_hash: string | null;
  actual_hash: string | null;
  audit_message: string | null;
  audited_at: string;
  created_at: string;
}

export interface ServerAlertRecord {
  id: number;
  alert_type: string;
  severity: string;
  related_log_id: number | null;
  related_audit_id: number | null;
  title: string;
  description: string;
  status: string;
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
  status: string;
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
  auditStatus: 'passed' | 'failed' | 'pending';
  auditMessage: string;
  alertGenerated: boolean;
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

export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T>;
export function createErrorResponse(message: string): ApiResponse<null>;
export function createListResponse<T>(message: string, data: T[]): ApiListResponse<T>;
export function validateLogSubmitPayload(payload: unknown): ProtocolValidationResult;
export function validateAgentStateSyncPayload(payload: unknown): ProtocolValidationResult;