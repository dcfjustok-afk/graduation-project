import { closeDatabase, openDatabase, persistDatabase } from "../db/sqliteClient";
import { escapeSqlString, executeSelect } from "../db/queryHelpers";

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

export interface CreateAlertPayload {
  alertType: string;
  severity?: string;
  relatedLogId?: number | null;
  relatedAuditId?: number | null;
  title: string;
  description: string;
  status?: string;
}

export async function listAlerts(): Promise<AlertEntity[]> {
  const { db } = await openDatabase();

  try {
    return executeSelect<AlertEntity>(db, `SELECT * FROM alerts ORDER BY created_at DESC, id DESC;`);
  } finally {
    closeDatabase(db);
  }
}

export async function createAlert(payload: CreateAlertPayload): Promise<AlertEntity> {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const alertType = escapeSqlString(payload.alertType);
    const severity = escapeSqlString(payload.severity || "medium");
    const title = escapeSqlString(payload.title);
    const description = escapeSqlString(payload.description);
    const status = escapeSqlString(payload.status || "open");
    const relatedLogId = payload.relatedLogId ?? "NULL";
    const relatedAuditId = payload.relatedAuditId ?? "NULL";

    db.exec(`
      INSERT INTO alerts (
        alert_type,
        severity,
        related_log_id,
        related_audit_id,
        title,
        description,
        status,
        created_at
      )
      VALUES (
        '${alertType}',
        '${severity}',
        ${relatedLogId},
        ${relatedAuditId},
        '${title}',
        '${description}',
        '${status}',
        '${now}'
      );
    `);

    persistDatabase(db, databasePath);

    return executeSelect<AlertEntity>(db, `SELECT * FROM alerts ORDER BY id DESC LIMIT 1;`)[0];
  } finally {
    closeDatabase(db);
  }
}