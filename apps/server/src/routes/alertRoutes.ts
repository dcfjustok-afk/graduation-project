import { Router } from "express";
import { listAlertsController } from "../controllers/alertController";

const alertRouter = Router();

alertRouter.get("/alerts", listAlertsController);

export { alertRouter };