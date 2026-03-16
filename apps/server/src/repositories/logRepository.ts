import { closeDatabase, openDatabase, persistDatabase } from "../db/sqliteClient";
import { escapeSqlString, executeSelect } from "../db/queryHelpers";

export interface LogRecordEntity {
  id: number;
  task_id: string;
  source_type: string;
  source_path: string | null;
  log_content: string;
  log_level: string;
  collected_at: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface CreateLogPayload {
  taskId: string;
  sourceType?: string;
  sourcePath?: string;
  logContent: string;
  logLevel?: string;
  collectedAt?: string;
}

export async function createLog(payload: CreateLogPayload): Promise<LogRecordEntity> {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const taskId = escapeSqlString(payload.taskId);
    const sourceType = escapeSqlString(payload.sourceType || "agent");
    const sourcePath = payload.sourcePath ? `'${escapeSqlString(payload.sourcePath)}'` : "NULL";
    const logContent = escapeSqlString(payload.logContent);
    const logLevel = escapeSqlString(payload.logLevel || "INFO");
    const collectedAt = escapeSqlString(payload.collectedAt || now);

    db.exec(`
      INSERT INTO logs (task_id, source_type, source_path, log_content, log_level, collected_at, created_at, updated_at, status)
      VALUES ('${taskId}', '${sourceType}', ${sourcePath}, '${logContent}', '${logLevel}', '${collectedAt}', '${now}', '${now}', 'collected');
    `);

    persistDatabase(db, databasePath);

    const insertedRecord = executeSelect<LogRecordEntity>(
      db,
      `SELECT * FROM logs ORDER BY id DESC LIMIT 1;`
    )[0];

    return insertedRecord;
  } finally {
    closeDatabase(db);
  }
}

export async function listLogs(): Promise<LogRecordEntity[]> {
  const { db } = await openDatabase();

  try {
    return executeSelect<LogRecordEntity>(db, `SELECT * FROM logs ORDER BY id DESC;`);
  } finally {
    closeDatabase(db);
  }
}