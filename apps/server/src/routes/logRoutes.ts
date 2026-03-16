import { Router } from "express";
import { listLogsController, submitLogController } from "../controllers/logController";

const logRouter = Router();

logRouter.post("/logs", submitLogController);
logRouter.get("/logs", listLogsController);

export { logRouter };