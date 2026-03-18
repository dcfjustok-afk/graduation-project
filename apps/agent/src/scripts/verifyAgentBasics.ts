import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const logPath = path.resolve(projectRoot, "logs/test-agent-verify.log");
  const statePath = path.resolve(projectRoot, "state/test-agent-verify.json");

  process.env.AGENT_LOG_FILE = logPath;
  process.env.AGENT_STATE_FILE = statePath;
  process.env.AGENT_NAME = "verify-agent";
  process.env.TASK_ID = "verify-agent-task";

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.mkdirSync(path.dirname(statePath), { recursive: true });

  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }

  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }

  fs.writeFileSync(logPath, "first line\nsecond line\n", "utf8");

  const { collectNewLogRecords } = await import("../collector/logCollector");
  const { loadOffsetState } = await import("../state/offsetStore");

  const firstBatch = collectNewLogRecords();
  assert.equal(firstBatch.length, 2, "第一次增量读取应读取 2 条日志");

  const noChanges = collectNewLogRecords();
  assert.equal(noChanges.length, 0, "未追加日志时不应重复读取");

  fs.appendFileSync(logPath, "third line\n", "utf8");
  const secondBatch = collectNewLogRecords();
  assert.equal(secondBatch.length, 1, "追加后应只读取新增的 1 条日志");

  const state = loadOffsetState();
  assert.equal(state.pendingQueue.length, 3, "待发送队列应累计 3 条记录");
  assert.equal(state.agentName, "verify-agent");
  assert.equal(state.lastOffset > 0, true, "偏移量应已经更新");

  console.log(
    JSON.stringify(
      {
        firstBatch: firstBatch.length,
        secondBatch: secondBatch.length,
        queueSize: state.pendingQueue.length,
        lastOffset: state.lastOffset,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[agent:basic-verify] failed", error);
  process.exit(1);
});
