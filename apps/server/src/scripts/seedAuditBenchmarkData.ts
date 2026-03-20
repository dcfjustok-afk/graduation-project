import { calculateLogHash } from "../blockchain/logHashService";
import { initializeDatabase } from "../db/initDatabase";
import { createLog, createLogHashRecord, updateLogContent } from "../repositories/logRepository";

function resolveDatasetSize() {
  const rawValue = process.env.BENCH_AUDIT_DATASET_SIZE || process.argv[2] || "100";
  const datasetSize = Number(rawValue);

  if (!Number.isInteger(datasetSize) || datasetSize <= 0) {
    throw new Error(`BENCH_AUDIT_DATASET_SIZE 必须为正整数，收到：${rawValue}`);
  }

  return datasetSize;
}

function buildLogPayload(index: number) {
  const taskId = `bench-audit-task-${String(index + 1).padStart(4, "0")}`;
  const collectedAt = new Date(Date.now() + index * 1000).toISOString();
  const logLevel = index % 10 === 0 ? "ERROR" : index % 3 === 0 ? "WARN" : "INFO";
  const logContent = `benchmark audit log ${index + 1} for ${taskId}`;

  return {
    taskId,
    sourceType: "benchmark-script",
    sourcePath: `/benchmarks/audit/${taskId}.log`,
    logContent,
    logLevel,
    collectedAt,
  };
}

async function seedAuditBenchmarkData() {
  const datasetSize = resolveDatasetSize();
  await initializeDatabase();

  let pendingCount = 0;
  let failedCount = 0;

  for (let index = 0; index < datasetSize; index += 1) {
    const payload = buildLogPayload(index);
    const createdLog = await createLog(payload);
    const expectedHash = calculateLogHash(payload.logContent);

    await createLogHashRecord({
      logId: createdLog.id,
      taskId: payload.taskId,
      logHash: expectedHash,
      chainName: "hardhat",
      contractAddress: null,
      transactionHash: null,
      blockNumber: null,
      onChainStatus: "benchmark_seeded",
    });

    if (index % 5 === 0) {
      await updateLogContent(createdLog.id, `${payload.logContent} [tampered]`);
      failedCount += 1;
      continue;
    }

    pendingCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        benchmark: "audit-seed",
        datasetSize,
        pendingCount,
        failedCount,
        executedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

seedAuditBenchmarkData().catch((error) => {
  console.error("[server:seed-audit-benchmark] failed", error);
  process.exit(1);
});