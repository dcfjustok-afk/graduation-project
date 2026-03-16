declare module "sql.js" {
  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export class Database {
    constructor(data?: Uint8Array | ArrayLike<number> | Buffer);
    exec(sql: string): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface InitSqlJsStaticOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: InitSqlJsStaticOptions): Promise<SqlJsStatic>;
}