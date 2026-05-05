import { calculateLogHash } from "../blockchain/logHashService";
import { initializeDatabase } from "../db/initDatabase";
import { closeDatabase, openDatabase, persistDatabase } from "../db/sqliteClient";
import { createAlert } from "../repositories/alertRepository";
import { createAuditRecord } from "../repositories/auditRepository";
import { createLog, createLogHashRecord, updateLogStatus, upsertAgentState } from "../repositories/logRepository";

interface SeedLog {
  taskId: string;
  level: "INFO" | "WARN" | "ERROR";
  sourcePath: string;
  content: string;
  originalContent?: string;
  auditStatus: "passed" | "failed" | "pending";
}

const seedLogs: SeedLog[] = [
  {
    taskId: "TASK-2026-001",
    level: "INFO",
    sourcePath: "/var/log/agent/task.log",
    content: "任务调度完成，执行结果已写入可信日志。",
    auditStatus: "passed",
  },
  {
    taskId: "TASK-2026-002",
    level: "INFO",
    sourcePath: "/var/log/agent/collector.log",
    content: "Agent 完成日志采集并提交后端服务。",
    auditStatus: "passed",
  },
  {
    taskId: "TASK-2026-003",
    level: "ERROR",
    sourcePath: "/var/log/agent/audit.log",
    content: "任务日志内容已被篡改，当前哈希不一致。",
    originalContent: "任务日志内容未被篡改，当前哈希一致。",
    auditStatus: "failed",
  },
  {
    taskId: "TASK-2026-004",
    level: "WARN",
    sourcePath: "/var/log/agent/retry.log",
    content: "日志提交出现短暂重试，随后完成存证。",
    auditStatus: "passed",
  },
  {
    taskId: "TASK-2026-005",
    level: "INFO",
    sourcePath: "/var/log/agent/blockchain.log",
    content: "链上存证交易确认，区块高度已记录。",
    auditStatus: "passed",
  },
  {
    taskId: "TASK-2026-006",
    level: "WARN",
    sourcePath: "/var/log/agent/pending.log",
    content: "日志已采集，等待下一轮审计批处理。",
    auditStatus: "pending",
  },
];

async function resetTables() {
  const { db, databasePath } = await openDatabase();

  try {
    db.exec("BEGIN TRANSACTION;");
    db.exec("DELETE FROM alerts;");
    db.exec("DELETE FROM audit_records;");
    db.exec("DELETE FROM log_hash_records;");
    db.exec("DELETE FROM logs;");
    db.exec("DELETE FROM agent_states;");
    db.exec("COMMIT;");
    persistDatabase(db, databasePath);
  } finally {
    closeDatabase(db);
  }
}

async function main() {
  await initializeDatabase();
  await resetTables();
  await initializeDatabase();

  const baseTime = Date.now() - seedLogs.length * 12 * 60 * 1000;

  for (const [index, item] of seedLogs.entries()) {
    const collectedAt = new Date(baseTime + index * 12 * 60 * 1000).toISOString();
    const log = await createLog({
      taskId: item.taskId,
      sourceType: "agent",
      sourcePath: item.sourcePath,
      logContent: item.content,
      logLevel: item.level,
      collectedAt,
    });

    const expectedContent = item.originalContent || item.content;
    const expectedHash = calculateLogHash(expectedContent);
    const actualHash = calculateLogHash(item.content);
    const hashRecord = await createLogHashRecord({
      logId: log.id,
      taskId: item.taskId,
      logHash: expectedHash,
      chainName: "hardhat",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      transactionHash: `0x${String(index + 1).padStart(64, "0")}`,
      blockNumber: 128 + index,
      onChainStatus: "confirmed",
    });

    const audit = await createAuditRecord({
      logId: log.id,
      logHashRecordId: Number(hashRecord.id),
      auditStatus: item.auditStatus,
      expectedHash,
      actualHash,
      auditMessage:
        item.auditStatus === "passed"
          ? "重新计算哈希与链上存证一致，审计通过。"
          : item.auditStatus === "failed"
            ? "hash_mismatch：重新计算哈希与链上存证不一致。"
            : "日志已完成存证，等待审计任务确认。",
      auditedAt: new Date(baseTime + index * 12 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    });

    await updateLogStatus(
      log.id,
      item.auditStatus === "passed" ? "audit_passed" : item.auditStatus === "failed" ? "audit_failed" : "audit_pending",
    );

    if (item.auditStatus === "failed") {
      await createAlert({
        alertType: "hash_mismatch",
        severity: "high",
        relatedLogId: log.id,
        relatedAuditId: audit.id,
        title: "hash_mismatch：任务日志哈希不一致",
        description: `${item.taskId} 的重新计算哈希与链上存证记录不一致，请复核来源路径 ${item.sourcePath}。`,
        status: "open",
      });
    }
  }

  await upsertAgentState({
    agentName: "local-log-agent",
    sourcePath: "/var/log/agent/task.log",
    lastOffset: 4096,
    lastHeartbeatAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    status: "running",
    errorMessage: null,
  });

  console.log("[server:seed-thesis] figure data seeded successfully");
}

main().catch((error) => {
  console.error("[server:seed-thesis] failed", error);
  process.exit(1);
});
