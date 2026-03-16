import { NextFunction, Request, Response } from "express";
import { createErrorResponse } from "../utils/apiResponse";

/**
 * 全局错误处理中间件。
 *
 * 作用：
 * - 捕获服务运行过程中的异常；
 * - 避免把堆栈信息直接暴露给前端；
 * - 保持错误响应格式一致。
 */
export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[server error]", error);
  res.status(500).json(createErrorResponse("服务器内部发生错误"));
}