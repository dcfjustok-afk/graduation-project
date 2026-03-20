import { Router } from "express";
import { generateLogsController } from "../controllers/logGenerateController";
import { listLogsController, submitLogController, syncAgentStateController } from "../controllers/logController";

const logRouter = Router();

logRouter.post("/logs", submitLogController);
logRouter.get("/logs", listLogsController);
logRouter.post("/logs/generate", generateLogsController);
logRouter.post("/agents/state", syncAgentStateController);

export { logRouter };
