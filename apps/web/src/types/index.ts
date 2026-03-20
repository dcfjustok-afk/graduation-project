import type { ReactNode } from 'react';

export type {
  AlertDistributionItem,
  ApiListResponse,
  ApiResponse,
  ApiSourceMode,
  AuditSummary,
  AuditExecutionResult,
  AuditTimelineEntry,
  DashboardData,
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
  AlertRecord,
  ViewAlertLevel,
  ViewAlertStatus,
  ViewLogStatus,
} from '@graduation-project/shared';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}
