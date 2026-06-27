type Row = Record<string, unknown>;

interface MockQueryResult {
  data: Row | Row[] | null;
  error: { message: string } | null;
  count?: number | null;
}

export type QueryHandler = (context: {
  table: string;
  operation: string;
  filters: Record<string, unknown>;
  payload?: Record<string, unknown> | Record<string, unknown>[];
}) => MockQueryResult;

function createFilterChain(
  table: string,
  operation: string,
  handler: QueryHandler,
  initialPayload?: Row | Row[]
) {
  const filters: Record<string, unknown> = {};
  let payload = initialPayload;

  const chain = {
    select: () => chain,
    insert: (rows: Row | Row[]) => {
      payload = rows;
      return chain;
    },
    update: (patch: Row) => {
      payload = patch;
      return chain;
    },
    upsert: (rows: Row | Row[], _options?: unknown) => {
      payload = rows;
      return chain;
    },
    delete: () => chain,
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return chain;
    },
    neq: (column: string, value: unknown) => {
      filters[`neq:${column}`] = value;
      return chain;
    },
    in: (column: string, value: unknown[]) => {
      filters[`in:${column}`] = value;
      return chain;
    },
    order: () => chain,
    maybeSingle: async () => handler({ table, operation: "maybeSingle", filters, payload }),
    single: async () => handler({ table, operation: "single", filters, payload }),
    then: (
      resolve: (value: MockQueryResult) => unknown,
      reject?: (reason: unknown) => unknown
    ) =>
      Promise.resolve(handler({ table, operation, filters, payload })).then(resolve, reject),
  };

  return chain;
}

export function createMockSupabase(handler: QueryHandler) {
  return {
    from: (table: string) => ({
      select: (_columns?: string, _options?: unknown) =>
        createFilterChain(table, "select", handler),
      insert: (rows: Row | Row[]) => createFilterChain(table, "insert", handler, rows),
      update: (patch: Row) => createFilterChain(table, "update", handler, patch),
      upsert: (rows: Row | Row[], options?: unknown) =>
        createFilterChain(table, "upsert", handler, rows),
      delete: () => createFilterChain(table, "delete", handler),
    }),
  };
}

export const TEST_UUIDS = {
  organization: "11111111-1111-4111-8111-111111111111",
  school: "22222222-2222-4222-8222-222222222222",
  student: "33333333-3333-4333-8333-333333333333",
  employee: "44444444-4444-4444-8444-444444444444",
  note: "55555555-5555-4555-8555-555555555555",
  tag: "66666666-6666-4666-8666-666666666666",
  relationship: "77777777-7777-4777-8777-777777777777",
  activity: "88888888-8888-4888-8888-888888888888",
  user: "99999999-9999-4999-8999-999999999999",
};
