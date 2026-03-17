import { initializeDatabase } from "../db/initDatabase";
import { persistLogAndWriteChain } from "../services/blockchainService";

async function main() {
  await initializeDatabase();

  const result = await persistLogAndWriteChain({
    taskId: "chain-demo-task-001",
    sourceType: "demo-script",
    sourcePath: "D:/demo/chain-demo.log",
    logContent: `chain demo log ${new Date().toISOString()}`,
    logLevel: "INFO",
    collectedAt: new Date().toISOString(),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[server:blockchain-demo] failed", error);
  process.exit(1);
});