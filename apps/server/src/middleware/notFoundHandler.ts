import { Request, Response } from "express";
import { ERROR_CODES } from "@graduation-project/shared";
import { createErrorResponse } from "../utils/apiResponse";

/**
 * 404 中间件。
 *
 * 当请求路径不存在时，统一返回结构化错误响应，
 * 避免直接把默认 HTML 错误页面返回给前端。
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(createErrorResponse(`未找到接口：${req.method} ${req.originalUrl}`, ERROR_CODES.NOT_FOUND));
}