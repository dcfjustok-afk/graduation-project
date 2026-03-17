import { initializeDatabase } from "../db/initDatabase";
import { createLog, createLogHashRecord } from "../repositories/logRepository";
import { persistLogAndWriteChain } from "../services/blockchainService";
import { runAuditForAllLogs } from "../services/auditExecutionService";

async function main() {
  await initializeDatabase();

  await persistLogAndWriteChain({
    taskId: "audit-demo-task-pass",
    sourceType: "demo-script",
    sourcePath: "D:/demo/audit-pass.log",
    logContent: `audit pass demo ${new Date().toISOString()}`,
    logLevel: "INFO",
    collectedAt: new Date().toISOString(),
  });

  const originalContent = `audit fail original ${new Date().toISOString()}`;
  const tamperedContent = `${originalContent} [tampered]`;

  const onChainResult = await persistLogAndWriteChain({
    taskId: "audit-demo-task-fail",
    sourceType: "tamper-script",
    sourcePath: "D:/demo/audit-fail.log",
    logContent: originalContent,
    logLevel: "ERROR",
    collectedAt: new Date().toISOString(),
  });

  const tamperedLog = await createLog({
    taskId: "audit-demo-task-fail",
    sourceType: "tamper-script",
    sourcePath: "D:/demo/audit-fail.log",
    logContent: tamperedContent,
    logLevel: "ERROR",
    collectedAt: new Date().toISOString(),
  });

  await createLogHashRecord({
    logId: tamperedLog.id,
    taskId: "audit-demo-task-fail",
    logHash: String(onChainResult.hashRecord.log_hash),
    chainName: "hardhat",
    contractAddress: String(onChainResult.hashRecord.contract_address || ""),
    transactionHash: String(onChainResult.hashRecord.transaction_hash || ""),
    blockNumber: Number(onChainResult.hashRecord.block_number || 0),
    onChainStatus: "confirmed",
  });

  const results = await runAuditForAllLogs();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error("[server:audit-demo] failed", error);
  process.exit(1);
});