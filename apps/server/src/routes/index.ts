import { Router } from "express";
import { healthRouter } from "./healthRoutes";

const apiRouter = Router();

/**
 * 总路由入口。
 *
 * 所有业务路由都统一挂载到 `/api` 之下，便于前后端约定接口前缀，
 * 也方便后续继续增加 `/logs`、`/audits`、`/alerts` 等模块路由。
 */
apiRouter.use(healthRouter);

export { apiRouter };