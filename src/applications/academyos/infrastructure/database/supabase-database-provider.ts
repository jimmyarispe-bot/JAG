import type {
  DatabaseFilter,
  DatabaseProvider,
  DatabaseRow,
  DatabaseTable,
  DatabaseTransaction,
} from "@/applications/academyos/infrastructure/database/types";

/** Minimal untyped surface so AcademyOS tables need not exist in generated Database types yet. */
export type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: DatabaseRow | null; error: { message: string } | null }>;
        order?: (column: string, opts?: { ascending?: boolean }) => Promise<{
          data: DatabaseRow[] | null;
          error: { message: string } | null;
        }>;
      };
      match: (filter: DatabaseFilter) => Promise<{
        data: DatabaseRow[] | null;
        error: { message: string } | null;
      }>;
    };
    upsert: (
      row: DatabaseRow,
      opts?: { onConflict?: string }
    ) => Promise<{ data: DatabaseRow | null; error: { message: string } | null }> | {
      select: () => {
        single: () => Promise<{ data: DatabaseRow | null; error: { message: string } | null }>;
      };
    };
    update: (patch: DatabaseRow) => {
      eq: (column: string, value: unknown) => {
        select: () => {
          maybeSingle: () => Promise<{
            data: DatabaseRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    delete: () => {
      eq: (
        column: string,
        value: unknown
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

function assertOk(error: { message: string } | null, action: string) {
  if (error) {
    throw new Error(`SupabaseDatabaseProvider ${action}: ${error.message}`);
  }
}

function createTable(client: SupabaseLikeClient, name: string): DatabaseTable {
  return {
    async findById(id) {
      const { data, error } = await client
        .from(name)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      assertOk(error, `findById(${name})`);
      return data;
    },

    async findMany(filter = {}) {
      const { data, error } = await client.from(name).select("*").match(filter);
      assertOk(error, `findMany(${name})`);
      return data ?? [];
    },

    async upsert(row) {
      const result = client.from(name).upsert(row, { onConflict: "id" }) as {
        select?: () => {
          single: () => Promise<{
            data: DatabaseRow | null;
            error: { message: string } | null;
          }>;
        };
        then?: unknown;
      };

      if (typeof result.select === "function") {
        const { data, error } = await result.select().single();
        assertOk(error, `upsert(${name})`);
        return data ?? row;
      }

      const awaited = await (result as Promise<{
        data: DatabaseRow | null;
        error: { message: string } | null;
      }>);
      assertOk(awaited.error, `upsert(${name})`);
      return awaited.data ?? row;
    },

    async update(id, patch) {
      const { data, error } = await client
        .from(name)
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      assertOk(error, `update(${name})`);
      return data;
    },

    async delete(id) {
      const { error } = await client.from(name).delete().eq("id", id);
      assertOk(error, `delete(${name})`);
      return true;
    },
  };
}

export function createSupabaseDatabaseProvider(
  client: SupabaseLikeClient
): DatabaseProvider {
  const from = (table: string) => createTable(client, table);
  return {
    id: "supabase",
    from,
    async withTransaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>) {
      // Supabase JS client has no multi-statement transactions in-browser/server SDK;
      // provide a transactional boundary for repository orchestration.
      return fn({ from });
    },
  };
}

export async function createDefaultSupabaseDatabaseProvider(): Promise<DatabaseProvider> {
  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  return createSupabaseDatabaseProvider(
    createServiceRoleClient() as unknown as SupabaseLikeClient
  );
}
