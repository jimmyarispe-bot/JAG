/**
 * Accounting Intelligence — ID generation.
 *
 * Injectable createId factory following platform DI patterns.
 */

let _counter = 0;

function defaultCreateId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${_counter}-${Date.now()}`;
}

/**
 * Create an accounting-scoped ID with an optional injectable factory.
 */
export function createAccountingId(
  prefix: string,
  createId?: (prefix: string) => string
): string {
  return (createId ?? defaultCreateId)(prefix);
}
