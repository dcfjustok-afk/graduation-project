import { Request, Response } from "express";
import { getAlerts } from "../services/alertService";
import { createListResponse } from "../utils/apiResponse";

export async function listAlertsController(_req: Request, res: Response) {
  const alerts = await getAlerts();
  return res.status(200).json(createListResponse("告警列表获取成功", alerts));
}