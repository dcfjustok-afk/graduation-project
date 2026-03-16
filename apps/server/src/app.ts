import cors from "cors";
import express from "express";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

/**
 * Express 应用实例。
 *
 * 这里专门负责组装中间件、路由和全局异常处理，
 * 让 `src/index.ts` 只关注“启动服务”这一件事。
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "后端服务已启动",
      data: {
        module: "server",
      },
    });
  });

  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}