import { Request, Response } from "express";
import { getOverview } from "../services/overviewService";
import { createSuccessResponse } from "../utils/apiResponse";

export async function getOverviewController(_req: Request, res: Response) {
  const overview = await getOverview();
  return res.status(200).json(createSuccessResponse("系统总览获取成功", overview));
}