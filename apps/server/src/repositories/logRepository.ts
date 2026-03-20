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

export interface LogHashRecordEntity {
  id: number;
  log_id: number;
  task_id: string;
  log_hash: string;
  chain_name: string;
  contract_address: string | null;
  transaction_hash: string | null;
  block_number: number | null;
  on_chain_status: string;
  created_at: string;
  updated_at: string;
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

export interface CreateLogHashRecordPayload {
  logId: number;
  taskId: string;
  logHash: string;
  chainName?: string;
  contractAddress?: string | null;
  transactionHash?: string | null;
  blockNumber?: number | null;
  onChainStatus?: string;
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

export async function getLogById(logId: number): Promise<LogRecordEntity | null> {
  const { db } = await openDatabase();

  try {
    return (
      executeSelect<LogRecordEntity>(db, `SELECT * FROM logs WHERE id = ${Number(logId)} LIMIT 1;`)[0] || null
    );
  } finally {
    closeDatabase(db);
  }
}

export async function getLatestLogHashRecordByLogId(logId: number): Promise<LogHashRecordEntity | null> {
  const { db } = await openDatabase();

  try {
    return (
      executeSelect<LogHashRecordEntity>(
        db,
        `SELECT * FROM log_hash_records WHERE log_id = ${Number(logId)} ORDER BY id DESC LIMIT 1;`
      )[0] || null
    );
  } finally {
    closeDatabase(db);
  }
}

export async function updateLogStatus(logId: number, status: string) {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const escapedStatus = escapeSqlString(status);

    db.exec(`
      UPDATE logs
      SET status = '${escapedStatus}', updated_at = '${now}'
      WHERE id = ${Number(logId)};
    `);

    persistDatabase(db, databasePath);

    return getLogById(logId);
  } finally {
    closeDatabase(db);
  }
}

export async function updateLogContent(logId: number, logContent: string) {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const escapedLogContent = escapeSqlString(logContent);

    db.exec(`
      UPDATE logs
      SET log_content = '${escapedLogContent}', updated_at = '${now}'
      WHERE id = ${Number(logId)};
    `);

    persistDatabase(db, databasePath);

    return getLogById(logId);
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

export async function createLogHashRecord(payload: CreateLogHashRecordPayload) {
  const { db, databasePath } = await openDatabase();

  try {
    const now = new Date().toISOString();
    const taskId = escapeSqlString(payload.taskId);
    const logHash = escapeSqlString(payload.logHash);
    const chainName = escapeSqlString(payload.chainName || "hardhat");
    const contractAddress = payload.contractAddress ? `'${escapeSqlString(payload.contractAddress)}'` : "NULL";
    const transactionHash = payload.transactionHash ? `'${escapeSqlString(payload.transactionHash)}'` : "NULL";
    const blockNumber = payload.blockNumber ?? "NULL";
    const onChainStatus = escapeSqlString(payload.onChainStatus || "pending");

    db.exec(`
      INSERT INTO log_hash_records (
        log_id,
        task_id,
        log_hash,
        chain_name,
        contract_address,
        transaction_hash,
        block_number,
        on_chain_status,
        created_at,
        updated_at
      )
      VALUES (
        ${payload.logId},
        '${taskId}',
        '${logHash}',
        '${chainName}',
        ${contractAddress},
        ${transactionHash},
        ${blockNumber},
        '${onChainStatus}',
        '${now}',
        '${now}'
      );
    `);

    persistDatabase(db, databasePath);

    return executeSelect<Record<string, unknown>>(
      db,
      `SELECT * FROM log_hash_records ORDER BY id DESC LIMIT 1;`
    )[0];
  } finally {
    closeDatabase(db);
  }
}