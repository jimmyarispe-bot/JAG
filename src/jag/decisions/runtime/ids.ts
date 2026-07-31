const sequences = new Map<string, number>();
let prefixOverride: string | null = null;

export function nextDecisionOpaqueId(kind: string): string {
  const next = (sequences.get(kind) ?? 0) + 1;
  sequences.set(kind, next);
  const prefix = prefixOverride ?? "jag";
  return `${prefix}_${kind}_${next}`;
}

export function setDecisionIdPrefixForTests(prefix: string | null): void {
  prefixOverride = prefix;
}

export function resetDecisionIdsForTests(): void {
  sequences.clear();
  prefixOverride = null;
}
