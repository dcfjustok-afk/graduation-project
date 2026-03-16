import { initializeDatabase } from "../db/initDatabase";

async function main() {
  const result = await initializeDatabase();

  console.log("[db:init] database initialized successfully");
  console.log("[db:init] database path:", result.databasePath);
  console.log("[db:init] tables:", result.createdTables.join(", "));
}

main().catch((error) => {
  console.error("[db:init] failed to initialize database", error);
  process.exit(1);
});