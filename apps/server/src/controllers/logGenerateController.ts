import { Request, Response } from "express";
import type { LogGeneratePayload, LogGenerateResponseData, LogLevel } from "@graduation-project/shared";
import { ERROR_CODES, validateLogSubmitPayload } from "@graduation-project/shared";
import { persistLogAndWriteChain } from "../services/blockchainService";
import { createErrorResponse, createSuccessResponse } from "../utils/apiResponse";

const MAX_GENERATE_COUNT = Number(process.env.LOG_GENERATE_MAX_COUNT || 200);
const MIN_INTERVAL_MS = Number(process.env.LOG_GENERATE_MIN_INTERVAL_MS || 0);
const GENERATE_ENABLED = (process.env.LOG_GENERATE_ENABLED || "true").toLowerCase() === "true";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateLogsController(req: Request, res: Response) {
  if (!GENERATE_ENABLED) {
    return res
      .status(403)
      .json(createErrorResponse("日志批量生成功能已禁用", ERROR_CODES.VALIDATION_ERROR, { enabled: false }));
  }

  const payload = req.body as Partial<LogGeneratePayload>;
  const count = Number(payload.count);
  const intervalMs = Number(payload.intervalMs || 0);

  if (!Number.isFinite(count) || count <= 0) {
    return res.status(400).json(createErrorResponse("count 必须为正整数", ERROR_CODES.VALIDATION_ERROR, { count }));
  }

  if (count > MAX_GENERATE_COUNT) {
    return res
      .status(400)
      .json(createErrorResponse(`count 不能超过 ${MAX_GENERATE_COUNT}`, ERROR_CODES.VALIDATION_ERROR, { max: MAX_GENERATE_COUNT }));
  }

  if (!Number.isFinite(intervalMs) || intervalMs < MIN_INTERVAL_MS) {
    return res
      .status(400)
      .json(createErrorResponse(`intervalMs 不能小于 ${MIN_INTERVAL_MS}`, ERROR_CODES.VALIDATION_ERROR, { min: MIN_INTERVAL_MS }));
  }

  if (!payload.base || typeof payload.base !== "object") {
    return res.status(400).json(createErrorResponse("base 必须提供", ERROR_CODES.VALIDATION_ERROR));
  }

  const baseValidation = validateLogSubmitPayload(payload.base);
  if (!baseValidation.valid) {
    return res
      .status(400)
      .json(createErrorResponse(baseValidation.errors.join("；"), ERROR_CODES.VALIDATION_ERROR, baseValidation.errors));
  }

  const results: Array<{ index: number; ok: boolean; logId?: number; error?: string }> = [];

  const overrides = Array.isArray(payload.overrides) ? payload.overrides : [];

  for (let index = 0; index < count; index += 1) {
    try {
      const override = overrides[index] || {};
      const itemPayload = {
        ...payload.base,
        ...override,
        sourceType: override.sourceType || payload.base.sourceType || "web-generator",
        logLevel: (override.logLevel || payload.base.logLevel || "INFO") as LogLevel | string,
      };

      const validation = validateLogSubmitPayload(itemPayload);
      if (!validation.valid) {
        results.push({ index, ok: false, error: validation.errors.join("；") });
        continue;
      }

      const created = await persistLogAndWriteChain({
        ...itemPayload,
      });

      results.push({ index, ok: true, logId: created.log.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      results.push({ index, ok: false, error: message });
    }

    if (intervalMs > 0 && index < count - 1) {
      await sleep(intervalMs);
    }
  }

  const successCount = results.filter((item) => item.ok).length;
  const failures = results.filter((item) => !item.ok);

  const response: LogGenerateResponseData = {
      successCount,
      failures: failures.map((item) => ({
        index: item.index,
        ok: false,
        error: item.error || "unknown error",
      })),
      createdLogIds: results.filter((item) => item.ok && item.logId).map((item) => item.logId as number),
      limits: {
        maxCount: MAX_GENERATE_COUNT,
        minIntervalMs: MIN_INTERVAL_MS,
      },
    };

  return res.status(200).json(createSuccessResponse("日志批量生成完成", response));
}
