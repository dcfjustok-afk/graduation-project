import { Router } from "express";
import { listAuditRecordsController } from "../controllers/auditController";

const auditRouter = Router();

auditRouter.get("/audits", listAuditRecordsController);

export { auditRouter };