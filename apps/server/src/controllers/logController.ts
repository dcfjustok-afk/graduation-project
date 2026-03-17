import { Request, Response } from "express";
import { submitLog, getLogs, syncAgentState } from "../services/logService";
import { createErrorResponse, createListResponse, createSuccessResponse } from "../utils/apiResponse";
import { persistLogAndWriteChain } from "../services/blockchainService";

export async function submitLogController(req: Request, res: Response) {
  const { taskId, sourceType, sourcePath, logContent, logLevel, collectedAt } = req.body;

  if (!taskId || !logContent) {
    return res.status(400).json(createErrorResponse("taskId 和 logContent 为必填字段"));
  }

  const result = await persistLogAndWriteChain({
    taskId,
    sourceType,
    sourcePath,
    logContent,
    logLevel,
    collectedAt,
  });

  return res.status(201).json(
    createSuccessResponse("日志提交成功", {
      log: result.log,
      hashRecord: result.hashRecord,
      blockchainError: result.error || null,
    })
  );
}

export async function listLogsController(_req: Request, res: Response) {
  const logs = await getLogs();
  return res.status(200).json(createListResponse("日志列表获取成功", logs));
}

export async function syncAgentStateController(req: Request, res: Response) {
  const { agentName, sourcePath, lastOffset, lastHeartbeatAt, lastSyncAt, status, errorMessage } = req.body;

  if (!agentName) {
    return res.status(400).json(createErrorResponse("agentName 为必填字段"));
  }

  const agentState = await syncAgentState({
    agentName,
    sourcePath,
    lastOffset,
    lastHeartbeatAt,
    lastSyncAt,
    status,
    errorMessage,
  });

  return res.status(200).json(createSuccessResponse("Agent 状态同步成功", agentState));
}