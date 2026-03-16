import { closeDatabase, openDatabase } from "./sqliteClient";
import { requiredTables } from "./schema";

export interface DatabaseVerificationResult {
  databasePath: string;
  tables: string[];
}

/**
 * 校验数据库是否包含系统所需的核心表。
 */
export async function verifyDatabase(): Promise<DatabaseVerificationResult> {
  const { db, databasePath } = await openDatabase();

  try {
    const queryResult = db.exec(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name;
    `);

    const tables =
      queryResult[0]?.values
        .map((row: unknown[]) => String(row[0]))
        .filter((tableName: string) => tableName !== "sqlite_sequence") || [];

    for (const requiredTable of requiredTables) {
      if (!tables.includes(requiredTable)) {
        throw new Error(`missing required table: ${requiredTable}`);
      }
    }

    return {
      databasePath,
      tables,
    };
  } finally {
    closeDatabase(db);
  }
}