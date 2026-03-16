import fs from "fs";
import { env } from "../config/env";
import { OffsetState, PendingLogRecord } from "../types/agent";
import { ensureParentDirectory } from "../utils/fsHelpers";

function createDefaultState(): OffsetState {
  return {
    agentName: env.agentName,
    sourcePath: env.logFilePath,
    lastOffset: 0,
    lastSyncAt: null,
    lastHeartbeatAt: null,
    pendingQueue: [],
  };
}

export function loadOffsetState(): OffsetState {
  ensureParentDirectory(env.stateFilePath);

  if (!fs.existsSync(env.stateFilePath)) {
    const initialState = createDefaultState();
    saveOffsetState(initialState);
    return initialState;
  }

  const raw = fs.readFileSync(env.stateFilePath, "utf8").trim();

  if (!raw) {
    const initialState = createDefaultState();
    saveOffsetState(initialState);
    return initialState;
  }

  const parsed = JSON.parse(raw) as OffsetState;

  return {
    ...createDefaultState(),
    ...parsed,
    pendingQueue: Array.isArray(parsed.pendingQueue) ? parsed.pendingQueue : [],
  };
}

export function saveOffsetState(state: OffsetState) {
  ensureParentDirectory(env.stateFilePath);
  fs.writeFileSync(env.stateFilePath, JSON.stringify(state, null, 2), "utf8");
}

export function updatePendingQueue(queue: PendingLogRecord[]) {
  const state = loadOffsetState();
  state.pendingQueue = queue;
  state.lastHeartbeatAt = new Date().toISOString();
  saveOffsetState(state);
}