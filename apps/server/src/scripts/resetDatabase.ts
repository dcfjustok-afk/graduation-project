import fs from "node:fs";
import { getConfiguredDatabasePath } from "../db/sqliteClient";

async function main() {
  const databasePath = getConfiguredDatabasePath();

  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
  }

  console.log("[db:reset] database reset successfully");
  console.log("[db:reset] database path:", databasePath);
}

main().catch((error) => {
  console.error("[db:reset] failed to reset database", error);
  process.exit(1);
});