import { closeDatabase, openDatabase } from "../db/sqliteClient";
import { executeSelect } from "../db/queryHelpers";

export interface AlertEntity {
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

export async function listAlerts(): Promise<AlertEntity[]> {
  const { db } = await openDatabase();

  try {
    return executeSelect<AlertEntity>(db, `SELECT * FROM alerts ORDER BY created_at DESC, id DESC;`);
  } finally {
    closeDatabase(db);
  }
}