import type { AlertRecord, DashboardData, LogRecord, ServerAlertRecord, ServerAuditRecord, ServerLogRecord, ServerOverviewStats } from '../types';
import { alerts, auditSummary, auditTimeline, logs, overviewCards, systemModules } from '../mock';

const wait = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardData(): Promise<DashboardData> {
  await wait();

  return {
    overviewCards,
    auditTimeline,
    systemModules,
    auditSummary,
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
    totalLogs: auditSummary.total,
    totalHashRecords: Math.max(auditSummary.passed, 0),
    totalAuditRecords: auditSummary.total,
    totalAlerts: alerts.length,
    openAlerts: alerts.filter((item) => item.status !== '已忽略').length,
    onlineAgents: 1,
  };
}

export async function getAuditRecords(): Promise<ServerAuditRecord[]> {
  await wait();

  return logs.map((item, index) => ({
    id: index + 1,
    log_id: index + 1,
    log_hash_record_id: index + 1,
    audit_status: item.status === '发现异常' ? 'failed' : item.status === '待审计' ? 'pending' : 'passed',
    expected_hash: item.hash,
    actual_hash: item.status === '发现异常' ? `${item.hash}-mismatch` : item.hash,
    audit_message:
      item.status === '发现异常'
        ? '检测到日志哈希与链上记录不一致'
        : item.status === '待审计'
          ? '等待审计任务执行'
          : '日志与链上记录一致',
    audited_at: item.submittedAt,
    created_at: item.submittedAt,
  }));
}

export async function getLogsRaw(): Promise<ServerLogRecord[]> {
  await wait();

  return logs.map((item, index) => ({
    id: index + 1,
    task_id: item.taskName,
    source_type: 'mock',
    source_path: item.source,
    log_content: `${item.taskName} ${item.level} ${item.status}`,
    log_level: item.level,
    collected_at: item.submittedAt,
    created_at: item.submittedAt,
    updated_at: item.submittedAt,
    status: item.status === '已上链' ? 'confirmed' : item.status === '待审计' ? 'pending' : 'failed',
  }));
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
    status: item.status === '待处理' ? 'open' : item.status === '处理中' ? 'processing' : 'ignored',
    created_at: item.time,
    resolved_at: item.status === '已忽略' ? item.time : null,
  }));
}
