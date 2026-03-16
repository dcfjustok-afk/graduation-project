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

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}
