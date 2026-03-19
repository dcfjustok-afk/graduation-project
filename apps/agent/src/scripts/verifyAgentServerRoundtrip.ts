import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { ApiListResponse, ApiResponse, ServerLogRecord, ServerOverviewStats } from "@graduation-project/shared";

async function waitFor(check: () => Promise<boolean>, timeoutMs = 15000, intervalMs = 300) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await check()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("等待 Agent 与 Server 闭环验证结果超时");
}

async function fetchList<T>(url: string) {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiListResponse<T>;
  assert.equal(response.ok, true, `请求失败：${url}`);
  assert.equal(payload.success, true, `接口返回 success=false：${url}`);
  return payload;
}

async function fetchItem<T>(url: string) {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiResponse<T>;
  assert.equal(response.ok, true, `请求失败：${url}`);
  assert.equal(payload.success, true, `接口返回 success=false：${url}`);
  return payload;
}

async function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const logPath = path.resolve(projectRoot, "logs/test-agent-e2e.log");
  const statePath = path.resolve(projectRoot, "state/test-agent-e2e.json");
  const taskId = `verify-agent-e2e-${Date.now()}`;
  const baseUrl = process.env.SERVER_BASE_URL || "http://127.0.0.1:3010";

  process.env.AGENT_LOG_FILE = logPath;
  process.env.AGENT_STATE_FILE = statePath;
  process.env.AGENT_NAME = "verify-agent-e2e";
  process.env.TASK_ID = taskId;
  process.env.SERVER_BASE_URL = baseUrl;
  process.env.POLL_INTERVAL_MS = "400";
  process.env.RETRY_INTERVAL_MS = "400";
  process.env.MAX_RETRY_TIMES = "3";

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.mkdirSync(path.dirname(statePath), { recursive: true });

  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }

  fs.writeFileSync(logPath, "agent-e2e-line-1\nagent-e2e-line-2\n", "utf8");

  const { createLogAgent } = await import("../agent/logAgent");
  const { loadOffsetState } = await import("../state/offsetStore");

  const stop = await createLogAgent().start();

  try {
    await waitFor(async () => {
      const logs = await fetchList<ServerLogRecord>(`${baseUrl}/api/logs`);
      return logs.data.filter((item) => item.task_id === taskId).length >= 2;
    });

    fs.appendFileSync(logPath, "agent-e2e-line-3\n", "utf8");

    await waitFor(async () => {
      const logs = await fetchList<ServerLogRecord>(`${baseUrl}/api/logs`);
      return logs.data.filter((item) => item.task_id === taskId).length >= 3;
    });

    await waitFor(async () => {
      const state = loadOffsetState();
      return state.pendingQueue.length === 0;
    });

    const logs = await fetchList<ServerLogRecord>(`${baseUrl}/api/logs`);
    const overview = await fetchItem<ServerOverviewStats>(`${baseUrl}/api/overview`);
    const state = loadOffsetState();
    const submittedLogs = logs.data.filter((item) => item.task_id === taskId);

    assert.equal(submittedLogs.length, 3, "Server 侧应收到 3 条 Agent 上报日志");
    assert.equal(overview.data.onlineAgents >= 1, true, "系统总览中应至少存在 1 个在线 Agent");
    assert.equal(state.pendingQueue.length, 0, "本地待发送队列应已清空");
    assert.equal(state.lastOffset > 0, true, "本地偏移量应已更新");

    console.log(
      JSON.stringify(
        {
          taskId,
          receivedLogs: submittedLogs.length,
          onlineAgents: overview.data.onlineAgents,
          pendingQueue: state.pendingQueue.length,
          lastOffset: state.lastOffset,
        },
        null,
        2,
      ),
    );
  } finally {
    stop();
  }
}

main().catch((error) => {
  console.error("[agent:e2e-verify] failed", error);
  process.exit(1);
});