import type { AuditExecutionResult, ServerAlertRecord, ServerAuditRecord, ServerLogRecord, ServerOverviewStats } from '../types';
import { httpClient } from './httpClient';

export function getOverviewStats() {
  return httpClient.request<ServerOverviewStats>('/overview');
}

export function getLogsRaw() {
  return httpClient.requestList<ServerLogRecord>('/logs');
}

export function getAuditRecords() {
  return httpClient.requestList<ServerAuditRecord>('/audits');
}

export function getAlertsRaw() {
  return httpClient.requestList<ServerAlertRecord>('/alerts');
}

export function runAudits() {
  return httpClient.post<AuditExecutionResult[]>('/audits/run');
}