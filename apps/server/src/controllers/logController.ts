import { Request, Response } from "express";
import { validateAgentStateSyncPayload, validateLogSubmitPayload } from "@graduation-project/shared";
import { submitLog, getLogs, syncAgentState } from "../services/logService";
import { createErrorResponse, createListResponse, createSuccessResponse } from "../utils/apiResponse";
import { persistLogAndWriteChain } from "../services/blockchainService";

export async function submitLogController(req: Request, res: Response) {
  const validation = validateLogSubmitPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json(createErrorResponse(validation.errors.join("；")));
  }

  const { taskId, sourceType, sourcePath, logContent, logLevel, collectedAt } = req.body;

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
  const validation = validateAgentStateSyncPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json(createErrorResponse(validation.errors.join("；")));
  }

  const { agentName, sourcePath, lastOffset, lastHeartbeatAt, lastSyncAt, status, errorMessage } = req.body;

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