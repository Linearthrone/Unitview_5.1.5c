declare module 'better-sqlite3' {
  interface Statement {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  interface DatabaseInstance {
    exec(sql: string): void;
    pragma(sql: string): void;
    prepare(sql: string): Statement;
  }

  interface DatabaseConstructor {
    new (filename: string): DatabaseInstance;
  }

  const Database: DatabaseConstructor;

  namespace Database {
    type Database = DatabaseInstance;
  }

  export default Database;
}
