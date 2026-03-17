import { initializeDatabase } from "../db/initDatabase";
import { listAlerts } from "../repositories/alertRepository";
import { listAuditRecords } from "../repositories/auditRepository";
import { runAuditForAllLogs } from "../services/auditExecutionService";

async function main() {
  await initializeDatabase();

  const results = await runAuditForAllLogs();
  const auditRecords = await listAuditRecords();
  const alerts = await listAlerts();

  const passedCount = results.filter((item) => item.auditStatus === "passed").length;
  const failedCount = results.filter((item) => item.auditStatus === "failed").length;

  if (passedCount < 1) {
    throw new Error("验证失败：未检测到 passed 审计结果");
  }

  if (failedCount < 1) {
    throw new Error("验证失败：未检测到 failed 审计结果");
  }

  if (!auditRecords.some((item) => item.audit_status === "failed")) {
    throw new Error("验证失败：audit_records 表中未写入 failed 记录");
  }

  if (!alerts.some((item) => item.alert_type === "hash_mismatch" && item.status === "open")) {
    throw new Error("验证失败：alerts 表中未生成异常告警");
  }

  console.log(
    JSON.stringify(
      {
        passedCount,
        failedCount,
        auditRecordCount: auditRecords.length,
        alertCount: alerts.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[server:audit-verify] failed", error);
  process.exit(1);
});