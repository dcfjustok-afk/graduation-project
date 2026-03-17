import { Router } from "express";
import {
	listAuditRecordsController,
	runAuditForAllLogsController,
	runAuditForSingleLogController,
} from "../controllers/auditController";

const auditRouter = Router();

auditRouter.get("/audits", listAuditRecordsController);
auditRouter.post("/audits/run", runAuditForAllLogsController);
auditRouter.post("/audits/:logId/run", runAuditForSingleLogController);

export { auditRouter };