import type { ReactNode } from 'react';
import type { TimelineItemProps } from 'antd';

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
  level: 'INFO' | 'WARN' | 'ERROR';
  status: string;
  submittedAt: string;
  hash: string;
  auditMessage?: string;
  expectedHash?: string;
  actualHash?: string;
}

export interface AlertRecord {
  id: string;
  level: '高危' | '中危' | '提示';
  title: string;
  description: string;
  time: string;
  status: '待处理' | '处理中' | '已忽略';
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

export interface DashboardData {
  overviewCards: OverviewCard[];
  auditTimeline: TimelineItemProps[];
  systemModules: SystemModule[];
  auditSummary: AuditSummary;
}

export interface DashboardViewData extends DashboardData {
  sourceMode: 'mock' | 'real';
}

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

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
