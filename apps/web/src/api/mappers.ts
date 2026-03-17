import type {
  AlertRecord,
  AuditSummary,
  DashboardViewData,
  LogRecord,
  OverviewCard,
  ServerAlertRecord,
  ServerAuditRecord,
  ServerLogRecord,
  ServerOverviewStats,
  SystemModule,
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
  };
}