import { initializeDatabase } from "../db/initDatabase";
import { createLog, upsertAgentState } from "../repositories/logRepository";

async function seedDemoData() {
  await initializeDatabase();

  await createLog({
    taskId: "demo-seed-task-001",
    sourceType: "demo-script",
    sourcePath: "D:/demo/manual-seed.log",
    logContent: "这是用于毕业设计演示的种子日志数据。",
    logLevel: "INFO",
    collectedAt: new Date().toISOString(),
  });

  await upsertAgentState({
    agentName: "demo-agent",
    sourcePath: "D:/aaaProject/graduation-project/apps/agent/logs/demo-agent.log",
    lastOffset: 0,
    lastHeartbeatAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    status: "idle",
    errorMessage: null,
  });

  console.log("[server:seed] demo data seeded successfully");
}

seedDemoData().catch((error) => {
  console.error("[server:seed] failed to seed demo data", error);
  process.exit(1);
});