import type { ReactNode } from 'react';

export type {
  AlertDistributionItem,
  ApiListResponse,
  ApiResponse,
  AuditSummary,
  AuditExecutionResult,
  AuditTimelineEntry,
  DashboardData,
  DashboardViewData,
  LogGenerateFailure,
  LogGeneratePayload,
  LogGenerateResponseData,
  LogRecord,
  LogSubmitPayload,
  LogSubmitResponseData,
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
