/**
 * Generic database provider — no business logic, no SQL in callers.
 * Concrete providers (memory / supabase) own query execution details.
 */

export type DatabaseRow = Record<string, unknown>;

export type DatabaseFilter = Record<string, string | number | boolean | null>;

export type DatabaseTable = {
  findById(id: string): Promise<DatabaseRow | null>;
  findMany(filter?: DatabaseFilter): Promise<DatabaseRow[]>;
  upsert(row: DatabaseRow): Promise<DatabaseRow>;
  update(id: string, patch: DatabaseRow): Promise<DatabaseRow | null>;
  delete(id: string): Promise<boolean>;
};

export type DatabaseTransaction = {
  from(table: string): DatabaseTable;
};

export type DatabaseProvider = {
  readonly id: "memory" | "supabase";
  from(table: string): DatabaseTable;
  withTransaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
  /** Optional lifecycle hook for pooled clients. */
  dispose?(): Promise<void> | void;
};
