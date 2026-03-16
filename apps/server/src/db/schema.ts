/**
 * SQLite 建表脚本集合。
 *
 * 设计原则：
 * 1. 保持字段容易理解，便于毕业设计讲解；
 * 2. 先覆盖最关键的日志采集、上链、审计、告警、Agent 状态；
 * 3. 不做过度复杂的规范化设计，优先保证后续开发和演示顺畅。
 */
export const schemaStatements = [
  `
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'agent',
    source_path TEXT,
    log_content TEXT NOT NULL,
    log_level TEXT NOT NULL DEFAULT 'INFO',
    collected_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'collected'
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS log_hash_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER NOT NULL,
    task_id TEXT NOT NULL,
    log_hash TEXT NOT NULL,
    chain_name TEXT NOT NULL DEFAULT 'hardhat',
    contract_address TEXT,
    transaction_hash TEXT,
    block_number INTEGER,
    on_chain_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id) REFERENCES logs(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS audit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER,
    log_hash_record_id INTEGER,
    audit_status TEXT NOT NULL,
    expected_hash TEXT,
    actual_hash TEXT,
    audit_message TEXT,
    audited_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id) REFERENCES logs(id),
    FOREIGN KEY (log_hash_record_id) REFERENCES log_hash_records(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    related_log_id INTEGER,
    related_audit_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    FOREIGN KEY (related_log_id) REFERENCES logs(id),
    FOREIGN KEY (related_audit_id) REFERENCES audit_records(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS agent_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL UNIQUE,
    source_path TEXT,
    last_offset INTEGER NOT NULL DEFAULT 0,
    last_heartbeat_at TEXT,
    last_sync_at TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_hash_records_task_id ON log_hash_records(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_records_status ON audit_records(audit_status);`,
  `CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);`,
  `CREATE INDEX IF NOT EXISTS idx_agent_states_status ON agent_states(status);`,
];

export const requiredTables = [
  "logs",
  "log_hash_records",
  "audit_records",
  "alerts",
  "agent_states",
];