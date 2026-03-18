import { openDatabase, persistDatabase, closeDatabase } from "../db/sqliteClient";
import { initializeDatabase } from "../db/initDatabase";
import { persistLogAndWriteChain } from "../services/blockchainService";
import { runAuditForLog } from "../services/auditExecutionService";
import { executeSelect } from "../db/queryHelpers";

interface ExperimentRow {
  id: number;
  task_id: string;
  log_content: string;
}

async function main() {
  await initializeDatabase();

  const originalContent = `tamper experiment original ${new Date().toISOString()}`;
  const tamperedContent = `${originalContent} [tampered]`;

  const writeResult = await persistLogAndWriteChain({
    taskId: `tamper-experiment-task-${Date.now()}`,
    sourceType: "tamper-experiment",
    sourcePath: "D:/demo/tamper-experiment.log",
    logContent: originalContent,
    logLevel: "ERROR",
    collectedAt: new Date().toISOString(),
  });

  const { db, databasePath } = await openDatabase();

  try {
    db.exec(`UPDATE logs SET log_content = '${tamperedContent.replace(/'/g, "''")}' WHERE id = ${writeResult.log.id};`);
    persistDatabase(db, databasePath);
  } finally {
    closeDatabase(db);
  }

  const auditResult = await runAuditForLog(writeResult.log.id);
  const { db: queryDb } = await openDatabase();

  try {
    const latestLog = executeSelect<ExperimentRow>(queryDb, `SELECT id, task_id, log_content FROM logs WHERE id = ${writeResult.log.id} LIMIT 1;`)[0];
    console.log(
      JSON.stringify(
        {
          experiment: "tamper-detection",
          logId: writeResult.log.id,
          taskId: latestLog.task_id,
          storedContent: latestLog.log_content,
          chainHashRecordId: writeResult.hashRecord.id,
          auditResult,
        },
        null,
        2,
      ),
    );
  } finally {
    closeDatabase(queryDb);
  }
}

main().catch((error) => {
  console.error("[server:tamper-experiment] failed", error);
  process.exit(1);
});
