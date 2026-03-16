import fs from "node:fs";
import path from "node:path";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import { env } from "../config/env";

let sqlitePromise: Promise<SqlJsStatic> | null = null;

/**
 * `apps/server` 项目根目录。
 *
 * 这里不能直接使用 `process.cwd()`，因为运行脚本和启动服务时，工作目录可能会变化；
 * 也不能直接基于 `dist` 目录去算，否则编译后的相对路径会偏移。
 *
 * 因此这里统一从当前文件所在位置向上回退两层，稳定定位到 `apps/server` 根目录。
 */
const projectRootPath = path.resolve(__dirname, "..", "..");

function getAbsoluteDbPath() {
  return path.resolve(projectRootPath, env.sqliteDbPath);
}

function ensureDatabaseDirectoryExists(databasePath: string) {
  const directoryPath = path.dirname(databasePath);
  fs.mkdirSync(directoryPath, { recursive: true });
}

async function getSqliteModule() {
  if (!sqlitePromise) {
    sqlitePromise = initSqlJs({});
  }

  return sqlitePromise;
}

/**
 * 打开 SQLite 数据库。
 *
 * 这里使用 sql.js 的原因是：
 * - 它不依赖本地 C++ 编译环境；
 * - 在当前 Windows 环境下更容易直接运行；
 * - 底层仍然是标准 SQLite 数据格式，适合本项目当前阶段使用。
 */
export async function openDatabase(): Promise<{ db: Database; databasePath: string }> {
  const SQL = await getSqliteModule();
  const databasePath = getAbsoluteDbPath();
  ensureDatabaseDirectoryExists(databasePath);

  if (fs.existsSync(databasePath)) {
    const fileBuffer = fs.readFileSync(databasePath);
    return {
      db: new SQL.Database(fileBuffer),
      databasePath,
    };
  }

  return {
    db: new SQL.Database(),
    databasePath,
  };
}

export function persistDatabase(db: Database, databasePath: string) {
  const data = db.export();
  fs.writeFileSync(databasePath, Buffer.from(data));
}

export function closeDatabase(db: Database) {
  db.close();
}

export function getConfiguredDatabasePath() {
  return getAbsoluteDbPath();
}