import type { DecisionContext } from "@/jag/decisions/contracts/definitions";

type CacheEntry = {
  context: DecisionContext;
  fingerprint: string;
};

const cache = new Map<string, CacheEntry>();

export function fingerprintFacts(
  facts: Readonly<Record<string, unknown>>
): string {
  // Stable JSON — key order sorted for determinism.
  const keys = Object.keys(facts).sort();
  const ordered: Record<string, unknown> = {};
  for (const k of keys) ordered[k] = facts[k];
  return JSON.stringify(ordered);
}

export function cacheKey(input: {
  decisionId: string;
  organizationId: string;
  mode: string;
  facts: Readonly<Record<string, unknown>>;
}): string {
  return [
    input.decisionId,
    input.organizationId,
    input.mode,
    fingerprintFacts(input.facts),
  ].join("|");
}

export function getCachedContext(key: string): DecisionContext | null {
  return cache.get(key)?.context ?? null;
}

export function putCachedContext(
  key: string,
  context: DecisionContext
): void {
  cache.set(key, {
    context,
    fingerprint: fingerprintFacts(context.facts),
  });
}

export function resetDecisionContextCacheForTests(): void {
  cache.clear();
}
