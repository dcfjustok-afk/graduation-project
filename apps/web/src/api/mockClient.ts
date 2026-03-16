import type { AlertRecord, DashboardData, LogRecord } from '../types';
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
