import { Router } from "express";
import { openDatabase, persistDatabase, closeDatabase } from "../db/sqliteClient";
import { initializeDatabase } from "../db/initDatabase";
import { persistLogAndWriteChain } from "../services/blockchainService";
import { runAuditForLog } from "../services/auditExecutionService";
import { executeSelect } from "../db/queryHelpers";
import { createSuccessResponse, createErrorResponse } from "@graduation-project/shared";

export const adminRouter = Router();

/**
 * POST /admin/reset
 * 清空所有数据表并重新初始化数据库。
 */
adminRouter.post("/admin/reset", async (_req, res) => {
  try {
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

    await initializeDatabase();

    res.json(createSuccessResponse("数据已重置", { reset: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "重置失败";
    res.status(500).json(createErrorResponse(message));
  }
});

interface ExperimentRow {
  id: number;
  task_id: string;
  log_content: string;
}

/**
 * POST /admin/tamper
 * 执行篡改实验：创建正常日志→上链→篡改数据库→审计检测。
 */
adminRouter.post("/admin/tamper", async (_req, res) => {
  try {
    const originalContent = `篡改实验原始日志 ${new Date().toISOString()}`;
    const tamperedContent = `${originalContent} [已被篡改]`;

    const writeResult = await persistLogAndWriteChain({
      taskId: `tamper-exp-${Date.now()}`,
      sourceType: "tamper-experiment",
      sourcePath: "/experiment/tamper-test.log",
      logContent: originalContent,
      logLevel: "ERROR",
      collectedAt: new Date().toISOString(),
    });

    const { db, databasePath } = await openDatabase();

    try {
      db.exec(
        `UPDATE logs SET log_content = '${tamperedContent.replace(/'/g, "''")}' WHERE id = ${writeResult.log.id};`
      );
      persistDatabase(db, databasePath);
    } finally {
      closeDatabase(db);
    }

    const auditResult = await runAuditForLog(writeResult.log.id);

    const { db: queryDb } = await openDatabase();
    let storedContent = "";

    try {
      const row = executeSelect<ExperimentRow>(
        queryDb,
        `SELECT id, task_id, log_content FROM logs WHERE id = ${writeResult.log.id} LIMIT 1;`
      )[0];
      storedContent = row?.log_content || "";
    } finally {
      closeDatabase(queryDb);
    }

    res.json(
      createSuccessResponse("篡改实验执行完成", {
        logId: writeResult.log.id,
        taskId: writeResult.log.task_id,
        originalContent,
        tamperedContent: storedContent,
        auditStatus: auditResult.auditStatus,
        auditMessage: auditResult.auditMessage,
        alertGenerated: auditResult.alertGenerated,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "篡改实验失败";
    res.status(500).json(createErrorResponse(message));
  }
});
