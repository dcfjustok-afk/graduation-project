import { createLog, CreateLogPayload, listLogs } from "../repositories/logRepository";

export async function submitLog(payload: CreateLogPayload) {
  return createLog(payload);
}

export async function getLogs() {
  return listLogs();
}