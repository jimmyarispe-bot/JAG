import type {
  DatabaseFilter,
  DatabaseProvider,
  DatabaseRow,
  DatabaseTable,
  DatabaseTransaction,
} from "@/applications/academyos/infrastructure/database/types";

function matches(row: DatabaseRow, filter?: DatabaseFilter): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([key, value]) => row[key] === value);
}

function clone(row: DatabaseRow): DatabaseRow {
  return { ...row };
}

export function createMemoryDatabaseProvider(): DatabaseProvider {
  const tables = new Map<string, Map<string, DatabaseRow>>();

  function tableMap(name: string): Map<string, DatabaseRow> {
    let map = tables.get(name);
    if (!map) {
      map = new Map();
      tables.set(name, map);
    }
    return map;
  }

  function table(name: string): DatabaseTable {
    return {
      async findById(id) {
        const hit = tableMap(name).get(id);
        return hit ? clone(hit) : null;
      },
      async findMany(filter) {
        return [...tableMap(name).values()]
          .filter((row) => matches(row, filter))
          .map(clone);
      },
      async upsert(row) {
        const id = String(row.id ?? "");
        if (!id) throw new Error(`MemoryDatabaseProvider: row.id required for ${name}`);
        const next = clone(row);
        tableMap(name).set(id, next);
        return clone(next);
      },
      async update(id, patch) {
        const existing = tableMap(name).get(id);
        if (!existing) return null;
        const next = { ...existing, ...patch, id };
        tableMap(name).set(id, next);
        return clone(next);
      },
      async delete(id) {
        return tableMap(name).delete(id);
      },
    };
  }

  const provider: DatabaseProvider = {
    id: "memory",
    from: table,
    async withTransaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>) {
      return fn({ from: table });
    },
  };

  return provider;
}
