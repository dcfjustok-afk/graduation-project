import {
  createLog,
  CreateLogPayload,
  listLogs,
  upsertAgentState,
  UpsertAgentStatePayload,
} from "../repositories/logRepository";

export async function submitLog(payload: CreateLogPayload) {
  return createLog(payload);
}

export async function getLogs() {
  return listLogs();
}

export async function syncAgentState(payload: UpsertAgentStatePayload) {
  return upsertAgentState(payload);
}