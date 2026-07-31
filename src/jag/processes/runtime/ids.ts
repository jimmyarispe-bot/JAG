/**
 * Deterministic opaque ids for process engine artifacts.
 * Per-kind sequences keep instance ids stable regardless of event volume.
 */

const sequences = new Map<string, number>();
let prefixOverride: string | null = null;

export function nextProcessOpaqueId(kind: string): string {
  const next = (sequences.get(kind) ?? 0) + 1;
  sequences.set(kind, next);
  const prefix = prefixOverride ?? "jag";
  return `${prefix}_${kind}_${next}`;
}

export function setProcessIdPrefixForTests(prefix: string | null): void {
  prefixOverride = prefix;
}

export function resetProcessIdsForTests(): void {
  sequences.clear();
  prefixOverride = null;
}
