import { Router } from "express";
import { healthCheckController } from "../controllers/healthController";

const healthRouter = Router();

/**
 * 健康检查路由。
 *
 * 访问路径：GET /api/health
 */
healthRouter.get("/health", healthCheckController);

export { healthRouter };