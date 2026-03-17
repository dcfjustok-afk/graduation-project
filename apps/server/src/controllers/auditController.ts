import { Request, Response } from "express";
import { getAuditRecords } from "../services/auditService";
import { createErrorResponse, createListResponse, createSuccessResponse } from "../utils/apiResponse";
import { runAuditForAllLogs, runAuditForLog } from "../services/auditExecutionService";

export async function listAuditRecordsController(_req: Request, res: Response) {
  const auditRecords = await getAuditRecords();
  return res.status(200).json(createListResponse("审计记录获取成功", auditRecords));
}

export async function runAuditForAllLogsController(_req: Request, res: Response) {
  const results = await runAuditForAllLogs();
  return res.status(200).json(createSuccessResponse("批量审计执行成功", results));
}

export async function runAuditForSingleLogController(req: Request, res: Response) {
  const logId = Number(req.params.logId);

  if (!Number.isFinite(logId) || logId <= 0) {
    return res.status(400).json(createErrorResponse("logId 必须为正整数"));
  }

  const result = await runAuditForLog(logId);
  return res.status(200).json(createSuccessResponse("单条日志审计执行成功", result));
}