const sequences = new Map<string, number>();
let prefixOverride: string | null = null;

export function nextCommunicationOpaqueId(kind: string): string {
  const next = (sequences.get(kind) ?? 0) + 1;
  sequences.set(kind, next);
  const prefix = prefixOverride ?? "jag";
  return `${prefix}_${kind}_${next}`;
}

export function setCommunicationIdPrefixForTests(prefix: string | null): void {
  prefixOverride = prefix;
}

export function resetCommunicationIdsForTests(): void {
  sequences.clear();
  prefixOverride = null;
}
