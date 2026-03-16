import { closeDatabase, openDatabase, persistDatabase } from "./sqliteClient";
import { requiredTables, schemaStatements } from "./schema";

export interface DatabaseInitializationResult {
  databasePath: string;
  createdTables: string[];
}

/**
 * 初始化数据库并执行全部建表脚本。
 *
 * 执行成功后会把数据库内容写入磁盘文件，
 * 这样后续服务启动时就可以直接读取同一个 SQLite 文件。
 */
export async function initializeDatabase(): Promise<DatabaseInitializationResult> {
  const { db, databasePath } = await openDatabase();

  try {
    db.exec("BEGIN TRANSACTION;");

    for (const statement of schemaStatements) {
      db.exec(statement);
    }

    db.exec("COMMIT;");
    persistDatabase(db, databasePath);

    return {
      databasePath,
      createdTables: requiredTables,
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  } finally {
    closeDatabase(db);
  }
}