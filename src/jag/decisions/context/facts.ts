/** Deterministic fact path resolution (dot paths, no prototypal lookup). */

export function readFactPath(
  facts: Readonly<Record<string, unknown>>,
  path: string
): unknown {
  if (!path.trim()) return undefined;
  const parts = path.split(".");
  let current: unknown = facts;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function mergeFacts(
  base: Readonly<Record<string, unknown>>,
  patch: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...base, ...patch });
}
