import { Router } from "express";
import { getOverviewController } from "../controllers/overviewController";

const overviewRouter = Router();

overviewRouter.get("/overview", getOverviewController);

export { overviewRouter };