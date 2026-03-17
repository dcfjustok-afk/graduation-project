import type {
  AlertDistributionItem,
  AlertRecord,
  AuditSummary,
  DashboardViewData,
  LogRecord,
  OverviewCard,
  ServerAlertRecord,
  ServerAuditRecord,
  ServerLogRecord,
  ServerOverviewStats,
  StatusDistributionItem,
  SystemModule,
  TrendPoint,
} from '../types';
import type { TimelineItemProps } from 'antd';

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return '暂无时间';
  }

  return value.replace('T', ' ').replace('Z', '').slice(0, 19);
}

function mapLogStatus(status: string) {
  if (status.includes('confirm') || status.includes('chain') || status === 'collected') {
    return '已上链';
  }

  if (status.includes('pending')) {
    return '待审计';
  }

  if (status.includes('fail')) {
    return '发现异常';
  }

  return '待审计';
}

function mapAlertLevel(severity: string): AlertRecord['level'] {
  if (severity.includes('高') || severity.toLowerCase().includes('high')) {
    return '高危';
  }

  if (severity.includes('中') || severity.toLowerCase().includes('medium')) {
    return '中危';
  }

  return '提示';
}

function mapAlertStatus(status: string): AlertRecord['status'] {
  if (status === 'open') {
    return '待处理';
  }

  if (status === 'processing') {
    return '处理中';
  }

  return '已忽略';
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
      status: audit.audit_status === 'passed' ? '审计通过' : audit.audit_status === 'failed' ? '发现异常' : '待审计',
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
  const passed = auditRecords.filter((item) => item.audit_status === 'passed').length;
  const pending = auditRecords.filter((item) => item.audit_status === 'pending').length;
  const abnormal = auditRecords.filter((item) => item.audit_status === 'failed').length;

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

export function buildAuditTimeline(auditRecords: ServerAuditRecord[], logs: ServerLogRecord[]): TimelineItemProps[] {
  if (auditRecords.length === 0 && logs.length === 0) {
    return [{ color: 'blue', children: '当前暂无审计与日志记录，等待后端生成数据。' }];
  }

  const auditItems = auditRecords.slice(0, 4).map<TimelineItemProps>((item) => ({
    color: item.audit_status === 'failed' ? 'red' : item.audit_status === 'passed' ? 'green' : 'blue',
    children: `${normalizeDate(item.audited_at)} 审计记录 #${item.id}：${item.audit_message || item.audit_status}`,
  }));

  if (auditItems.length > 0) {
    return auditItems;
  }

  return logs.slice(0, 4).map<TimelineItemProps>((item) => ({
    color: 'blue',
    children: `${normalizeDate(item.collected_at)} 接收到任务 ${item.task_id} 的日志。`,
  }));
}

export function buildLogTrend(logs: ServerLogRecord[], auditRecords: ServerAuditRecord[]): TrendPoint[] {
  const auditByLogId = new Map(auditRecords.filter((item) => item.log_id !== null).map((item) => [item.log_id, item.audit_status]));
  const grouping = new Map<string, TrendPoint>();

  for (const log of logs.slice().reverse()) {
    const label = getDateLabel(log.collected_at || log.created_at);
    const current = grouping.get(label) || { label, total: 0, abnormal: 0 };
    current.total += 1;

    if (auditByLogId.get(log.id) === 'failed') {
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
  sourceMode: 'mock' | 'real',
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