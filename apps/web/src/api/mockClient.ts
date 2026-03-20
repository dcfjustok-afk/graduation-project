import {
  AUDIT_STATUSES,
  SERVER_ALERT_STATUSES,
  validateLogSubmitPayload,
  VIEW_ALERT_LEVELS,
  VIEW_ALERT_STATUSES,
  VIEW_LOG_STATUSES,
} from '@graduation-project/shared';
import type {
  AlertRecord,
  DashboardData,
  LogGeneratePayload,
  LogGenerateResponseData,
  LogRecord,
  LogSubmitPayload,
  LogSubmitResponseData,
  ServerAlertRecord,
  ServerAuditRecord,
  ServerLogRecord,
  ServerOverviewStats,
} from '../types';
import { alerts, auditSummary, auditTimeline, logs, overviewCards, systemModules } from '../mock';

const wait = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_GENERATE_COUNT = 200;
let nextMockLogId = logs.length + 1;

const mockServerLogs: ServerLogRecord[] = logs.map((item, index) => ({
  id: index + 1,
  task_id: item.taskName,
  source_type: 'mock',
  source_path: item.source,
  log_content: `${item.taskName} ${item.level} ${item.status}`,
  log_level: item.level,
  collected_at: item.submittedAt,
  created_at: item.submittedAt,
  updated_at: item.submittedAt,
  status:
    item.status === VIEW_LOG_STATUSES.CHAINED || item.status === VIEW_LOG_STATUSES.AUDIT_PASSED
      ? 'confirmed'
      : item.status === VIEW_LOG_STATUSES.PENDING_AUDIT
        ? 'pending'
        : 'failed',
}));

function createMockServerLog(payload: LogSubmitPayload): ServerLogRecord {
  const now = new Date().toISOString();

  return {
    id: nextMockLogId++,
    task_id: payload.taskId,
    source_type: payload.sourceType || 'web-generator',
    source_path: payload.sourcePath || '/virtual/web-generator.log',
    log_content: payload.logContent,
    log_level: payload.logLevel === 'ERROR' ? 'ERROR' : payload.logLevel === 'WARN' ? 'WARN' : 'INFO',
    collected_at: payload.collectedAt || now,
    created_at: now,
    updated_at: now,
    status: 'pending',
  };
}

function createHashRecord(log: ServerLogRecord) {
  return {
    id: log.id,
    log_id: log.id,
    task_id: log.task_id,
    log_hash: `mock-hash-${log.id}`,
    chain_name: 'mock-chain',
    contract_address: null,
    transaction_hash: `0xmock${String(log.id).padStart(8, '0')}`,
    block_number: log.id,
    on_chain_status: 'confirmed',
    created_at: log.created_at,
    updated_at: log.updated_at,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  await wait();

  return {
    overviewCards,
    auditTimeline,
    systemModules,
    auditSummary,
    logTrend: [
      { label: '03-16 09', total: 2, abnormal: 0 },
      { label: '03-16 10', total: 3, abnormal: 1 },
      { label: '03-16 11', total: 4, abnormal: 1 },
      { label: '03-16 12', total: 5, abnormal: 0 },
    ],
    statusDistribution: [
      { label: '审计通过', value: auditSummary.passed, color: '#16a34a' },
      { label: '待审计', value: auditSummary.pending, color: '#f59e0b' },
      { label: '异常记录', value: auditSummary.abnormal, color: '#ef4444' },
    ],
    alertDistribution: [
      { label: VIEW_ALERT_LEVELS.HIGH, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.HIGH).length, color: '#ef4444' },
      { label: VIEW_ALERT_LEVELS.MEDIUM, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.MEDIUM).length, color: '#f59e0b' },
      { label: VIEW_ALERT_LEVELS.INFO, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.INFO).length, color: '#3b82f6' },
    ],
  };
}

export async function getLogs(): Promise<LogRecord[]> {
  await wait();
  return logs;
}

export async function getAlerts(): Promise<AlertRecord[]> {
  await wait();
  return alerts;
}

export async function getOverviewStats(): Promise<ServerOverviewStats> {
  await wait();

  return {
    totalLogs: mockServerLogs.length,
    totalHashRecords: mockServerLogs.filter((item) => item.status !== 'failed').length,
    totalAuditRecords: mockServerLogs.length,
    totalAlerts: alerts.length,
    openAlerts: alerts.filter((item) => item.status !== VIEW_ALERT_STATUSES.IGNORED).length,
    onlineAgents: 1,
  };
}

export async function getAuditRecords(): Promise<ServerAuditRecord[]> {
  await wait();

  return mockServerLogs.map((item) => ({
    id: item.id,
    log_id: item.id,
    log_hash_record_id: item.id,
    audit_status:
      item.status === 'failed'
        ? AUDIT_STATUSES.FAILED
        : item.status === 'pending'
          ? AUDIT_STATUSES.PENDING
          : AUDIT_STATUSES.PASSED,
    expected_hash: `mock-hash-${item.id}`,
    actual_hash: item.status === 'failed' ? `mock-hash-${item.id}-mismatch` : `mock-hash-${item.id}`,
    audit_message:
      item.status === 'failed'
        ? '检测到日志哈希与链上记录不一致'
        : item.status === 'pending'
          ? '等待审计任务执行'
          : '日志与链上记录一致',
    audited_at: item.collected_at,
    created_at: item.created_at,
  }));
}

export async function getLogsRaw(): Promise<ServerLogRecord[]> {
  await wait();

  return mockServerLogs.slice();
}

export async function getAlertsRaw(): Promise<ServerAlertRecord[]> {
  await wait();

  return alerts.map((item, index) => ({
    id: index + 1,
    alert_type: item.level,
    severity: item.level,
    related_log_id: index + 1,
    related_audit_id: index + 1,
    title: item.title,
    description: item.description,
    status:
      item.status === VIEW_ALERT_STATUSES.OPEN
        ? SERVER_ALERT_STATUSES.OPEN
        : item.status === VIEW_ALERT_STATUSES.PROCESSING
          ? SERVER_ALERT_STATUSES.PROCESSING
          : SERVER_ALERT_STATUSES.IGNORED,
    created_at: item.time,
    resolved_at: item.status === VIEW_ALERT_STATUSES.IGNORED ? item.time : null,
  }));
}

export async function createLog(payload: LogSubmitPayload): Promise<LogSubmitResponseData> {
  await wait(180);

  const validation = validateLogSubmitPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join('；'));
  }

  const log = createMockServerLog(payload);
  mockServerLogs.unshift(log);

  return {
    log,
    hashRecord: createHashRecord(log),
    blockchainError: null,
  };
}

export async function generateLogs(payload: LogGeneratePayload): Promise<LogGenerateResponseData> {
  await wait(220);

  if (payload.count > MAX_GENERATE_COUNT) {
    throw new Error(`count 不能超过 ${MAX_GENERATE_COUNT}`);
  }

  const failures: LogGenerateResponseData['failures'] = [];
  const createdLogIds: number[] = [];
  const overrides = Array.isArray(payload.overrides) ? payload.overrides : [];

  for (let index = 0; index < payload.count; index += 1) {
    const itemPayload = {
      ...payload.base,
      ...(overrides[index] || {}),
    };

    const validation = validateLogSubmitPayload(itemPayload);

    if (!validation.valid) {
      failures.push({ index, ok: false, error: validation.errors.join('；') });
      continue;
    }

    const created = await createLog(itemPayload);
    createdLogIds.push(created.log.id);
  }

  return {
    successCount: createdLogIds.length,
    failures,
    createdLogIds,
    limits: {
      maxCount: MAX_GENERATE_COUNT,
      minIntervalMs: 0,
    },
  };
}
