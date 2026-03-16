import { closeDatabase, openDatabase } from "../db/sqliteClient";
import { executeSelect } from "../db/queryHelpers";

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

export async function listAuditRecords(): Promise<AuditRecordEntity[]> {
  const { db } = await openDatabase();

  try {
    return executeSelect<AuditRecordEntity>(db, `SELECT * FROM audit_records ORDER BY audited_at DESC, id DESC;`);
  } finally {
    closeDatabase(db);
  }
}