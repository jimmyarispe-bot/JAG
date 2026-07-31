/**
 * Deterministic ordering for Runtime Specification artifacts.
 */

function cmp(a: string, b: string): number {
  return a.localeCompare(b);
}

export function sortByKey<T>(
  items: readonly T[] | undefined,
  keyOf: (item: T) => string
): T[] {
  return [...(items ?? [])].sort((a, b) => cmp(keyOf(a), keyOf(b)));
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort(cmp);
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}
