import type { AlertRecord, DashboardViewData, LogRecord, ServerAlertRecord, ServerAuditRecord, ServerLogRecord, ServerOverviewStats } from '../types';
import { apiEnv, type ApiSourceMode } from './env';
import { buildDashboardViewData, mapServerAlertsToView, mapServerLogsToView, mergeAuditIntoLogs } from './mappers';
import * as mockClient from './mockClient';
import * as realClient from './realClient';

type RawBundle = {
  stats: ServerOverviewStats;
  logs: ServerLogRecord[];
  audits: ServerAuditRecord[];
  alerts: ServerAlertRecord[];
};

async function loadRawBundle(): Promise<RawBundle> {
  if (apiEnv.sourceMode === 'real') {
    const [stats, logs, audits, alerts] = await Promise.all([
      realClient.getOverviewStats(),
      realClient.getLogsRaw(),
      realClient.getAuditRecords(),
      realClient.getAlertsRaw(),
    ]);

    return { stats, logs, audits, alerts };
  }

  const [stats, logs, audits, alerts] = await Promise.all([
    mockClient.getOverviewStats(),
    mockClient.getLogsRaw(),
    mockClient.getAuditRecords(),
    mockClient.getAlertsRaw(),
  ]);

  return { stats, logs, audits, alerts };
}

export async function getDashboardData(): Promise<DashboardViewData> {
  const bundle = await loadRawBundle();
  return buildDashboardViewData(apiEnv.sourceMode as ApiSourceMode, bundle.stats, bundle.logs, bundle.audits, bundle.alerts);
}

export async function getLogs(): Promise<LogRecord[]> {
  const bundle = await loadRawBundle();
  return mergeAuditIntoLogs(mapServerLogsToView(bundle.logs), bundle.audits);
}

export async function getAlerts(): Promise<AlertRecord[]> {
  const bundle = await loadRawBundle();
  return mapServerAlertsToView(bundle.alerts);
}

export async function getAuditPageData(): Promise<{ dashboard: DashboardViewData; logs: LogRecord[] }> {
  const bundle = await loadRawBundle();

  return {
    dashboard: buildDashboardViewData(apiEnv.sourceMode as ApiSourceMode, bundle.stats, bundle.logs, bundle.audits, bundle.alerts),
    logs: mergeAuditIntoLogs(mapServerLogsToView(bundle.logs), bundle.audits),
  };
}

export async function runAudits() {
  if (apiEnv.sourceMode === 'real') {
    return realClient.runAudits();
  }

  return [];
}