import { Database } from "sql.js";

/**
 * 把 sql.js 的查询结果转换成更方便使用的对象数组。
 *
 * sql.js 原始返回值是：
 * - 列名数组 columns
 * - 二维值数组 values
 *
 * 这里把它转成 [{字段名: 值}] 的形式，后续仓储层读起来更直观。
 */
export function executeSelect<T>(db: Database, sql: string): T[] {
  const result = db.exec(sql);

  if (!result.length) {
    return [];
  }

  const [{ columns, values }] = result;

  return values.map((row) => {
    const record: Record<string, unknown> = {};

    columns.forEach((column, index) => {
      record[column] = row[index];
    });

    return record as T;
  });
}

export function escapeSqlString(value: string) {
  return value.replace(/'/g, "''");
}