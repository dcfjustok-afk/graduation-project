import { Request, Response } from "express";
import { getHealthStatus } from "../services/healthService";
import { createSuccessResponse } from "../utils/apiResponse";

/**
 * 健康检查控制器。
 *
 * 控制器的职责是：
 * 1. 接收 HTTP 请求；
 * 2. 调用服务层获取业务结果；
 * 3. 用统一响应格式返回给前端。
 */
export function healthCheckController(_req: Request, res: Response) {
  const healthStatus = getHealthStatus();

  res.status(200).json(createSuccessResponse("服务运行正常", healthStatus));
}