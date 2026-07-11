/**
 * Enterprise Financial Intelligence Engine — ID generation.
 *
 * Injectable createId factory following codebase DI patterns.
 */

let _counter = 0;

function defaultCreateId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${_counter}-${Date.now()}`;
}

/**
 * Create a finance-scoped ID with an optional injectable factory.
 * Callers may inject their own `createId` for deterministic test IDs.
 */
export function createFinanceId(
  prefix: string,
  createId?: (prefix: string) => string
): string {
  return (createId ?? defaultCreateId)(prefix);
}
