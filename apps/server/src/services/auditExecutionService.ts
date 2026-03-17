import { createLogRegistryReadClient } from "../blockchain/logRegistryClient";
import { calculateLogHash } from "../blockchain/logHashService";
import { createAlert } from "../repositories/alertRepository";
import { createAuditRecord, listAuditRecords } from "../repositories/auditRepository";
import {
  getLatestLogHashRecordByLogId,
  getLogById,
  listLogs,
  updateLogStatus,
} from "../repositories/logRepository";

export interface AuditExecutionResult {
  logId: number;
  taskId: string;
  expectedHash: string | null;
  actualHash: string;
  onChainHash: string | null;
  auditStatus: "passed" | "failed" | "pending";
  auditMessage: string;
  alertGenerated: boolean;
}

interface OnChainLogRecord {
  logHash?: string;
}

async function resolveOnChainHashes(taskId: string): Promise<string[]> {
  try {
    const { contract } = createLogRegistryReadClient();
    const logs = await contract.getLogsByTaskId(taskId);

    if (!Array.isArray(logs) || logs.length === 0) {
      return [];
    }

    return logs
      .map((item) => (item as OnChainLogRecord)?.logHash || null)
      .filter((item): item is string => Boolean(item));
  } catch {
    return [];
  }
}

export async function runAuditForLog(logId: number): Promise<AuditExecutionResult> {
  const log = await getLogById(logId);

  if (!log) {
    throw new Error(`未找到日志记录：${logId}`);
  }

  const hashRecord = await getLatestLogHashRecordByLogId(log.id);
  const actualHash = calculateLogHash(log.log_content);
  const expectedHash = hashRecord?.log_hash || null;
  const onChainHashes = await resolveOnChainHashes(log.task_id);
  const matchedOnChainHash = expectedHash && onChainHashes.includes(expectedHash) ? expectedHash : null;
  const latestOnChainHash = onChainHashes[onChainHashes.length - 1] || null;
  const onChainHash = matchedOnChainHash || latestOnChainHash;

  let auditStatus: AuditExecutionResult["auditStatus"] = "pending";
  let auditMessage = "当前日志缺少完整链上记录，等待后续补充审计。";

  if (expectedHash && matchedOnChainHash) {
    if (expectedHash === actualHash) {
      auditStatus = "passed";
      auditMessage = "重新计算哈希与数据库、链上记录一致，审计通过。";
    } else {
      auditStatus = "failed";
      auditMessage = "重新计算哈希与数据库或链上记录不一致，判定为异常。";
    }
  } else if (expectedHash && onChainHashes.length > 0) {
    if (expectedHash === actualHash) {
      auditStatus = "pending";
      auditMessage = "数据库记录与本地哈希一致，但当前任务链上未匹配到该条日志哈希。";
    } else {
      auditStatus = "failed";
      auditMessage = "本地哈希与数据库记录不一致，且链上未匹配到对应存证，判定为异常。";
    }
  } else if (expectedHash) {
    if (expectedHash === actualHash) {
      auditStatus = "pending";
      auditMessage = "本地哈希与数据库记录一致，但链上记录暂不可用。";
    } else {
      auditStatus = "failed";
      auditMessage = "本地哈希与数据库记录不一致，判定为异常。";
    }
  }

  const auditRecord = await createAuditRecord({
    logId: log.id,
    logHashRecordId: hashRecord?.id || null,
    auditStatus,
    expectedHash: onChainHash || expectedHash,
    actualHash,
    auditMessage,
  });

  let alertGenerated = false;

  if (auditStatus === "failed") {
    await createAlert({
      alertType: "hash_mismatch",
      severity: "high",
      relatedLogId: log.id,
      relatedAuditId: auditRecord.id,
      title: `任务 ${log.task_id} 存在篡改风险`,
      description: `日志 #${log.id} 的重新计算哈希与存证记录不一致，请立即复核。`,
      status: "open",
    });
    alertGenerated = true;
  }

  await updateLogStatus(log.id, auditStatus === "passed" ? "audit_passed" : auditStatus === "failed" ? "audit_failed" : "audit_pending");

  return {
    logId: log.id,
    taskId: log.task_id,
    expectedHash,
    actualHash,
    onChainHash,
    auditStatus,
    auditMessage,
    alertGenerated,
  };
}

export async function runAuditForAllLogs() {
  const logs = await listLogs();
  const results: AuditExecutionResult[] = [];

  for (const log of logs) {
    results.push(await runAuditForLog(log.id));
  }

  return results;
}

export async function getAuditExecutionOverview() {
  const auditRecords = await listAuditRecords();

  return {
    total: auditRecords.length,
    passed: auditRecords.filter((item) => item.audit_status === "passed").length,
    failed: auditRecords.filter((item) => item.audit_status === "failed").length,
    pending: auditRecords.filter((item) => item.audit_status === "pending").length,
  };
}