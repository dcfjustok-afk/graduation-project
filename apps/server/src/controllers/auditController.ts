import { Request, Response } from "express";
import { getAuditRecords } from "../services/auditService";
import { createListResponse } from "../utils/apiResponse";

export async function listAuditRecordsController(_req: Request, res: Response) {
  const auditRecords = await getAuditRecords();
  return res.status(200).json(createListResponse("审计记录获取成功", auditRecords));
}