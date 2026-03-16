import { verifyDatabase } from "../db/verifyDatabase";

async function main() {
  const result = await verifyDatabase();

  console.log("[db:verify] database verification passed");
  console.log("[db:verify] database path:", result.databasePath);
  console.log("[db:verify] discovered tables:", result.tables.join(", "));
}

main().catch((error) => {
  console.error("[db:verify] database verification failed", error);
  process.exit(1);
});