import {
  AUDIT_STATUSES,
  VIEW_ALERT_LEVELS,
  VIEW_ALERT_STATUSES,
  VIEW_LOG_STATUSES,
} from '@graduation-project/shared';
import type {
  AlertDistributionItem,
  AlertRecord,
  AuditTimelineEntry,
  AuditSummary,
  DashboardViewData,
  LogGeneratePayload,
  LogRecord,
  LogSubmitPayload,
  OverviewCard,
  ServerAlertRecord,
  ServerAuditRecord,
  ServerLogRecord,
  ServerOverviewStats,
  StatusDistributionItem,
  SystemModule,
  TrendPoint,
} from '../types';

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return '暂无时间';
  }

  return value.replace('T', ' ').replace('Z', '').slice(0, 19);
}

function mapLogStatus(status: string) {
  if (status.includes('confirm') || status.includes('chain') || status === 'collected') {
    return VIEW_LOG_STATUSES.CHAINED;
  }

  if (status.includes('pending')) {
    return VIEW_LOG_STATUSES.PENDING_AUDIT;
  }

  if (status.includes('fail')) {
    return VIEW_LOG_STATUSES.ABNORMAL;
  }

  return VIEW_LOG_STATUSES.PENDING_AUDIT;
}

function mapAlertLevel(severity: string): AlertRecord['level'] {
  if (severity.includes('高') || severity.toLowerCase().includes('high')) {
    return VIEW_ALERT_LEVELS.HIGH;
  }

  if (severity.includes('中') || severity.toLowerCase().includes('medium')) {
    return VIEW_ALERT_LEVELS.MEDIUM;
  }

  return VIEW_ALERT_LEVELS.INFO;
}

function mapAlertStatus(status: string): AlertRecord['status'] {
  if (status === 'open') {
    return VIEW_ALERT_STATUSES.OPEN;
  }

  if (status === 'processing') {
    return VIEW_ALERT_STATUSES.PROCESSING;
  }

  return VIEW_ALERT_STATUSES.IGNORED;
}

function getDateLabel(value: string | null | undefined) {
  const normalized = normalizeDate(value);
  return normalized === '暂无时间' ? normalized : normalized.slice(5, 16);
}

export function mapServerLogsToView(logs: ServerLogRecord[]): LogRecord[] {
  return logs.map((item) => ({
    id: `LOG-${item.id}`,
    taskName: item.task_id,
    source: item.source_path || item.source_type,
    level: item.log_level === 'ERROR' ? 'ERROR' : item.log_level === 'WARN' ? 'WARN' : 'INFO',
    status: mapLogStatus(item.status),
    submittedAt: normalizeDate(item.collected_at || item.created_at),
    hash: `log-${item.id}`,
  }));
}

export interface LogGeneratorFormValues {
  taskName: string;
  sourceType: string;
  sourcePath: string;
  logLevel: 'INFO' | 'WARN' | 'ERROR';
  logContent: string;
  collectedAt?: string;
  batchCount?: number;
  intervalMs?: number;
}

function toIsoString(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function mapLogGeneratorToSubmitPayload(values: LogGeneratorFormValues): LogSubmitPayload {
  return {
    taskId: values.taskName.trim() || `web-task-${Date.now()}`,
    sourceType: values.sourceType.trim() || 'web-generator',
    sourcePath: values.sourcePath.trim() || '/virtual/web-generator.log',
    logContent: values.logContent.trim(),
    logLevel: values.logLevel,
    collectedAt: toIsoString(values.collectedAt),
  };
}

export function mapLogGeneratorToBatchPayload(values: LogGeneratorFormValues): LogGeneratePayload {
  const base = mapLogGeneratorToSubmitPayload(values);
  const count = Math.max(1, Number(values.batchCount || 1));

  return {
    count,
    intervalMs: Math.max(0, Number(values.intervalMs || 0)),
    base,
    overrides: Array.from({ length: count }, (_, index) => ({
      taskId: `${base.taskId}-${String(index + 1).padStart(2, '0')}`,
      logContent: `${base.logContent} #${index + 1}`,
      collectedAt: new Date(Date.parse(base.collectedAt || new Date().toISOString()) + index * Math.max(1000, Number(values.intervalMs || 0))).toISOString(),
    })),
  };
}

export function mapCreatedServerLogToView(log: ServerLogRecord): LogRecord {
  return {
    id: `LOG-${log.id}`,
    taskName: log.task_id,
    source: log.source_path || log.source_type,
    level: log.log_level === 'ERROR' ? 'ERROR' : log.log_level === 'WARN' ? 'WARN' : 'INFO',
    status: mapLogStatus(log.status),
    submittedAt: normalizeDate(log.collected_at || log.created_at),
    hash: `log-${log.id}`,
  };
}

export function mergeAuditIntoLogs(logs: LogRecord[], auditRecords: ServerAuditRecord[]): LogRecord[] {
  const auditByLogId = new Map(auditRecords.filter((item) => item.log_id !== null).map((item) => [item.log_id, item]));

  return logs.map((item) => {
    const numericId = Number(item.id.replace('LOG-', ''));
    const audit = auditByLogId.get(numericId);

    if (!audit) {
      return item;
    }

    return {
      ...item,
      status:
        audit.audit_status === AUDIT_STATUSES.PASSED
          ? VIEW_LOG_STATUSES.AUDIT_PASSED
          : audit.audit_status === AUDIT_STATUSES.FAILED
            ? VIEW_LOG_STATUSES.ABNORMAL
            : VIEW_LOG_STATUSES.PENDING_AUDIT,
      auditMessage: audit.audit_message || undefined,
      expectedHash: audit.expected_hash || undefined,
      actualHash: audit.actual_hash || undefined,
      hash: audit.expected_hash || item.hash,
    };
  });
}

export function mapServerAlertsToView(alerts: ServerAlertRecord[]): AlertRecord[] {
  return alerts.map((item) => ({
    id: `ALT-${item.id}`,
    level: mapAlertLevel(item.severity || item.alert_type),
    title: item.title,
    description: item.description,
    time: normalizeDate(item.created_at),
    status: mapAlertStatus(item.status),
  }));
}

export function buildAuditSummary(stats: ServerOverviewStats, auditRecords: ServerAuditRecord[], alerts: ServerAlertRecord[]): AuditSummary {
  const passed = auditRecords.filter((item) => item.audit_status === AUDIT_STATUSES.PASSED).length;
  const pending = auditRecords.filter((item) => item.audit_status === AUDIT_STATUSES.PENDING).length;
  const abnormal = auditRecords.filter((item) => item.audit_status === AUDIT_STATUSES.FAILED).length;

  return {
    total: stats.totalLogs,
    passed,
    warning: alerts.filter((item) => item.status !== 'ignored').length,
    abnormal,
    pending,
  };
}

export function buildOverviewCards(stats: ServerOverviewStats, summary: AuditSummary): OverviewCard[] {
  return [
    { title: '日志总量', value: stats.totalLogs, suffix: '条', trend: '实时统计' },
    { title: '链上存证记录', value: stats.totalHashRecords, suffix: '条', trend: '已接后端' },
    { title: '审计记录数', value: stats.totalAuditRecords, suffix: '条', trend: '实时聚合' },
    { title: '活动告警数', value: summary.warning, suffix: '条', trend: stats.openAlerts > 0 ? '需关注' : '稳定' },
  ];
}

export function buildSystemModules(stats: ServerOverviewStats): SystemModule[] {
  return [
    {
      name: '日志采集 Agent',
      progress: stats.onlineAgents > 0 ? 88 : 72,
      description: `当前在线 Agent 数：${stats.onlineAgents}`,
    },
    {
      name: '后端审计服务',
      progress: stats.totalLogs > 0 ? 78 : 60,
      description: `已接入真实接口，累计日志 ${stats.totalLogs} 条。`,
    },
    {
      name: '区块链存证模块',
      progress: stats.totalHashRecords > 0 ? 76 : 52,
      description: `累计链上存证 ${stats.totalHashRecords} 条。`,
    },
    {
      name: '可视化审计平台',
      progress: 86,
      description: '已支持 mock / 真实接口切换。',
    },
  ];
}

export function buildAuditTimeline(auditRecords: ServerAuditRecord[], logs: ServerLogRecord[]): AuditTimelineEntry[] {
  if (auditRecords.length === 0 && logs.length === 0) {
    return [{ color: 'blue', content: '当前暂无审计与日志记录，等待后端生成数据。' }];
  }

  const auditItems = auditRecords.slice(0, 4).map<AuditTimelineEntry>((item) => ({
    color: item.audit_status === 'failed' ? 'red' : item.audit_status === 'passed' ? 'green' : 'blue',
    content: `${normalizeDate(item.audited_at)} 审计记录 #${item.id}：${item.audit_message || item.audit_status}`,
  }));

  if (auditItems.length > 0) {
    return auditItems;
  }

  return logs.slice(0, 4).map<AuditTimelineEntry>((item) => ({
    color: 'blue',
    content: `${normalizeDate(item.collected_at)} 接收到任务 ${item.task_id} 的日志。`,
  }));
}

export function buildLogTrend(logs: ServerLogRecord[], auditRecords: ServerAuditRecord[]): TrendPoint[] {
  const auditByLogId = new Map(auditRecords.filter((item) => item.log_id !== null).map((item) => [item.log_id, item.audit_status]));
  const grouping = new Map<string, TrendPoint>();

  for (const log of logs.slice().reverse()) {
    const label = getDateLabel(log.collected_at || log.created_at);
    const current = grouping.get(label) || { label, total: 0, abnormal: 0 };
    current.total += 1;

    if (auditByLogId.get(log.id) === AUDIT_STATUSES.FAILED) {
      current.abnormal += 1;
    }

    grouping.set(label, current);
  }

  return Array.from(grouping.values()).slice(-7);
}

export function buildStatusDistribution(summary: AuditSummary): StatusDistributionItem[] {
  return [
    { label: '审计通过', value: summary.passed, color: '#16a34a' },
    { label: '待审计', value: summary.pending, color: '#f59e0b' },
    { label: '异常记录', value: summary.abnormal, color: '#ef4444' },
  ];
}

export function buildAlertDistribution(alerts: ServerAlertRecord[]): AlertDistributionItem[] {
  const stats = new Map<string, number>([
    ['高危', 0],
    ['中危', 0],
    ['提示', 0],
  ]);

  for (const alert of alerts) {
    const level = mapAlertLevel(alert.severity || alert.alert_type);
    stats.set(level, (stats.get(level) || 0) + 1);
  }

  return [
    { label: '高危', value: stats.get('高危') || 0, color: '#ef4444' },
    { label: '中危', value: stats.get('中危') || 0, color: '#f59e0b' },
    { label: '提示', value: stats.get('提示') || 0, color: '#3b82f6' },
  ];
}

export function buildDashboardViewData(
  sourceMode: DashboardViewData['sourceMode'],
  stats: ServerOverviewStats,
  logs: ServerLogRecord[],
  auditRecords: ServerAuditRecord[],
  alerts: ServerAlertRecord[],
): DashboardViewData {
  const auditSummary = buildAuditSummary(stats, auditRecords, alerts);

  return {
    sourceMode,
    overviewCards: buildOverviewCards(stats, auditSummary),
    auditTimeline: buildAuditTimeline(auditRecords, logs),
    systemModules: buildSystemModules(stats),
    auditSummary,
    logTrend: buildLogTrend(logs, auditRecords),
    statusDistribution: buildStatusDistribution(auditSummary),
    alertDistribution: buildAlertDistribution(alerts),
  };
}
