import { listAuditRecords } from "../repositories/auditRepository";

export async function getAuditRecords() {
  return listAuditRecords();
}