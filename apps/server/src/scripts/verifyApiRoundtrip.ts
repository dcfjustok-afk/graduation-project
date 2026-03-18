import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { createApp } from "../app";
import { initializeDatabase } from "../db/initDatabase";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
  };
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  assert.equal(response.ok, true, `请求 ${path} 失败，状态码 ${response.status}`);
  assert.equal(payload.success, true, `接口 ${path} 返回 success=false`);
  return payload;
}

async function main() {
  await initializeDatabase();

  const app = createApp();
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await request<{ status?: string }>(baseUrl, "/api/health");
    assert.equal(typeof health.message, "string");

    const overview = await request<Record<string, number>>(baseUrl, "/api/overview");
    assert.equal(typeof overview.data.totalLogs, "number");

    const taskId = `verify-api-task-${Date.now()}`;
    const submit = await request<{ log: { id: number; task_id: string }; blockchainError: string | null }>(baseUrl, "/api/logs", {
      method: "POST",
      body: JSON.stringify({
        taskId,
        sourceType: "verify-script",
        sourcePath: "D:/verify/api.log",
        logContent: `verify api log ${new Date().toISOString()}`,
        logLevel: "INFO",
        collectedAt: new Date().toISOString(),
      }),
    });

    assert.equal(submit.data.log.task_id, taskId);
    assert.equal(submit.data.blockchainError, null, `链上写入失败：${submit.data.blockchainError}`);

    const logs = await request<Array<{ id: number; task_id: string }>>(baseUrl, "/api/logs");
    assert.equal(logs.data.some((item) => item.task_id === taskId), true, "日志列表中未找到刚提交的记录");

    const audits = await request<Array<{ audit_status: string }>>(baseUrl, "/api/audits/run", { method: "POST" });
    assert.equal(Array.isArray(audits.data), true);

    const auditList = await request<Array<{ audit_status: string }>>(baseUrl, "/api/audits");
    assert.equal(Array.isArray(auditList.data), true);

    const alerts = await request<Array<{ status: string }>>(baseUrl, "/api/alerts");
    assert.equal(Array.isArray(alerts.data), true);

    console.log(
      JSON.stringify(
        {
          health: health.message,
          totalLogs: logs.meta?.total ?? logs.data.length,
          totalAudits: auditList.meta?.total ?? auditList.data.length,
          totalAlerts: alerts.meta?.total ?? alerts.data.length,
          lastTaskId: taskId,
          blockchainError: submit.data.blockchainError,
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

main().catch((error) => {
  console.error("[server:api-verify] failed", error);
  process.exit(1);
});
