import type { ServerOverviewStats } from "@graduation-project/shared";
import { closeDatabase, openDatabase } from "../db/sqliteClient";
import { executeSelect } from "../db/queryHelpers";

interface CountResult {
  total: number;
}

export type OverviewStats = ServerOverviewStats;

async function queryCount(sql: string) {
  const { db } = await openDatabase();

  try {
    const result = executeSelect<CountResult>(db, sql)[0];
    return Number(result?.total || 0);
  } finally {
    closeDatabase(db);
  }
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [totalLogs, totalHashRecords, totalAuditRecords, totalAlerts, openAlerts, onlineAgents] = await Promise.all([
    queryCount(`SELECT COUNT(*) AS total FROM logs;`),
    queryCount(`SELECT COUNT(*) AS total FROM log_hash_records;`),
    queryCount(`SELECT COUNT(*) AS total FROM audit_records;`),
    queryCount(`SELECT COUNT(*) AS total FROM alerts;`),
    queryCount(`SELECT COUNT(*) AS total FROM alerts WHERE status = 'open';`),
    queryCount(`SELECT COUNT(*) AS total FROM agent_states WHERE status = 'running';`),
  ]);

  return {
    totalLogs,
    totalHashRecords,
    totalAuditRecords,
    totalAlerts,
    openAlerts,
    onlineAgents,
  };
}