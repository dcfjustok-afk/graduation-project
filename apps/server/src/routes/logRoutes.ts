import { Router } from "express";
import { listLogsController, submitLogController, syncAgentStateController } from "../controllers/logController";

const logRouter = Router();

logRouter.post("/logs", submitLogController);
logRouter.get("/logs", listLogsController);
logRouter.post("/agents/state", syncAgentStateController);

export { logRouter };