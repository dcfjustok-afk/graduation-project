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

export interface UpsertAgentStatePayload {
  agentName: string;
  sourcePath?: string;
  lastOffset?: number;
  lastHeartbeatAt?: string;
  lastSyncAt?: string;
  status?: string;
  errorMessage?: string | null;
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

export async function upsertAgentState(payload: UpsertAgentStatePayload) {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const agentName = escapeSqlString(payload.agentName);
    const sourcePath = payload.sourcePath ? `'${escapeSqlString(payload.sourcePath)}'` : "NULL";
    const lastOffset = Number(payload.lastOffset || 0);
    const lastHeartbeatAt = payload.lastHeartbeatAt
      ? `'${escapeSqlString(payload.lastHeartbeatAt)}'`
      : `'${now}'`;
    const lastSyncAt = payload.lastSyncAt ? `'${escapeSqlString(payload.lastSyncAt)}'` : "NULL";
    const status = escapeSqlString(payload.status || "running");
    const errorMessage = payload.errorMessage ? `'${escapeSqlString(payload.errorMessage)}'` : "NULL";

    db.exec(`
      INSERT INTO agent_states (
        agent_name,
        source_path,
        last_offset,
        last_heartbeat_at,
        last_sync_at,
        status,
        error_message,
        created_at,
        updated_at
      )
      VALUES (
        '${agentName}',
        ${sourcePath},
        ${lastOffset},
        ${lastHeartbeatAt},
        ${lastSyncAt},
        '${status}',
        ${errorMessage},
        '${now}',
        '${now}'
      )
      ON CONFLICT(agent_name) DO UPDATE SET
        source_path = excluded.source_path,
        last_offset = excluded.last_offset,
        last_heartbeat_at = excluded.last_heartbeat_at,
        last_sync_at = excluded.last_sync_at,
        status = excluded.status,
        error_message = excluded.error_message,
        updated_at = '${now}';
    `);

    persistDatabase(db, databasePath);

    return executeSelect<Record<string, unknown>>(
      db,
      `SELECT * FROM agent_states WHERE agent_name = '${agentName}' LIMIT 1;`
    )[0];
  } finally {
    closeDatabase(db);
  }
}