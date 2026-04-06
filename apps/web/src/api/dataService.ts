import type {
  AlertRecord,
  DashboardViewData,
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
import { buildDashboardViewData, mapServerAlertsToView, mapServerLogsToView, mergeAuditIntoLogs } from './mappers';
import * as realClient from './realClient';

type RawBundle = {
  stats: ServerOverviewStats;
  logs: ServerLogRecord[];
  audits: ServerAuditRecord[];
  alerts: ServerAlertRecord[];
};

async function loadRawBundle(): Promise<RawBundle> {
  const [stats, logs, audits, alerts] = await Promise.all([
    realClient.getOverviewStats(),
    realClient.getLogsRaw(),
    realClient.getAuditRecords(),
    realClient.getAlertsRaw(),
  ]);

  return { stats, logs, audits, alerts };
}

export async function getDashboardData(): Promise<DashboardViewData> {
  const bundle = await loadRawBundle();
  return buildDashboardViewData(bundle.stats, bundle.logs, bundle.audits, bundle.alerts);
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
    dashboard: buildDashboardViewData(bundle.stats, bundle.logs, bundle.audits, bundle.alerts),
    logs: mergeAuditIntoLogs(mapServerLogsToView(bundle.logs), bundle.audits),
  };
}

export async function runAudits() {
  return realClient.runAudits();
}

export async function createLog(payload: LogSubmitPayload): Promise<LogSubmitResponseData> {
  return realClient.createLog(payload);
}

export async function generateLogs(payload: LogGeneratePayload): Promise<LogGenerateResponseData> {
  return realClient.generateLogs(payload);
}

export async function resetAllData(): Promise<void> {
  return realClient.resetAllData();
}

export async function runTamperExperiment(): Promise<TamperExperimentResult> {
  return realClient.runTamperExperiment();
}

export interface TamperExperimentResult {
  logId: number;
  taskId: string;
  originalContent: string;
  tamperedContent: string;
  auditStatus: string;
  auditMessage: string;
  alertGenerated: boolean;
}
