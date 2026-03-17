import { closeDatabase, openDatabase, persistDatabase } from "../db/sqliteClient";
import { escapeSqlString, executeSelect } from "../db/queryHelpers";

export interface AuditRecordEntity {
  id: number;
  log_id: number | null;
  log_hash_record_id: number | null;
  audit_status: string;
  expected_hash: string | null;
  actual_hash: string | null;
  audit_message: string | null;
  audited_at: string;
  created_at: string;
}

export interface CreateAuditRecordPayload {
  logId: number;
  logHashRecordId: number | null;
  auditStatus: string;
  expectedHash?: string | null;
  actualHash?: string | null;
  auditMessage?: string | null;
  auditedAt?: string;
}

export async function listAuditRecords(): Promise<AuditRecordEntity[]> {
  const { db } = await openDatabase();

  try {
    return executeSelect<AuditRecordEntity>(db, `SELECT * FROM audit_records ORDER BY audited_at DESC, id DESC;`);
  } finally {
    closeDatabase(db);
  }
}

export async function createAuditRecord(payload: CreateAuditRecordPayload): Promise<AuditRecordEntity> {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const auditedAt = escapeSqlString(payload.auditedAt || now);
    const auditStatus = escapeSqlString(payload.auditStatus);
    const expectedHash = payload.expectedHash ? `'${escapeSqlString(payload.expectedHash)}'` : "NULL";
    const actualHash = payload.actualHash ? `'${escapeSqlString(payload.actualHash)}'` : "NULL";
    const auditMessage = payload.auditMessage ? `'${escapeSqlString(payload.auditMessage)}'` : "NULL";
    const logHashRecordId = payload.logHashRecordId ?? "NULL";

    db.exec(`
      INSERT INTO audit_records (
        log_id,
        log_hash_record_id,
        audit_status,
        expected_hash,
        actual_hash,
        audit_message,
        audited_at,
        created_at
      )
      VALUES (
        ${payload.logId},
        ${logHashRecordId},
        '${auditStatus}',
        ${expectedHash},
        ${actualHash},
        ${auditMessage},
        '${auditedAt}',
        '${now}'
      );
    `);

    persistDatabase(db, databasePath);

    return executeSelect<AuditRecordEntity>(db, `SELECT * FROM audit_records ORDER BY id DESC LIMIT 1;`)[0];
  } finally {
    closeDatabase(db);
  }
}