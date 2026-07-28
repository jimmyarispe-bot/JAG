/**
 * Matching rule configuration — scoring weights & tolerances.
 */

export type MatchingRuleConfig = {
  readonly dateToleranceDays: number;
  readonly exactAmountWeight: number;
  readonly dateWeight: number;
  readonly descriptionWeight: number;
  readonly referenceWeight: number;
  readonly checkNumberWeight: number;
  readonly autoAcceptThreshold: number;
  readonly suggestThreshold: number;
  readonly largeVarianceAmount: number;
};

const DEFAULT: MatchingRuleConfig = Object.freeze({
  dateToleranceDays: 3,
  exactAmountWeight: 0.45,
  dateWeight: 0.15,
  descriptionWeight: 0.2,
  referenceWeight: 0.1,
  checkNumberWeight: 0.1,
  autoAcceptThreshold: 0.85,
  suggestThreshold: 0.55,
  largeVarianceAmount: 5_000,
});

const overrides = new Map<string, MatchingRuleConfig>();

export function getMatchingRules(organizationId: string): MatchingRuleConfig {
  return overrides.get(organizationId) ?? DEFAULT;
}

export function setMatchingRules(
  organizationId: string,
  partial: Partial<MatchingRuleConfig>
): MatchingRuleConfig {
  const next = Object.freeze({
    ...getMatchingRules(organizationId),
    ...partial,
  });
  overrides.set(organizationId, next);
  return next;
}

export function resetMatchingRulesForTests(): void {
  overrides.clear();
}

export function tokenizeDescription(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

export function descriptionSimilarity(a: string, b: string): number {
  const ta = tokenizeDescription(a);
  const tb = tokenizeDescription(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

export function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.abs(da - db) / (24 * 60 * 60 * 1000);
}

export function extractReference(text: string): string | null {
  const m =
    text.match(/\b(?:ref|reference|inv|invoice)[#:\s-]*([A-Z0-9-]{4,})\b/i) ??
    text.match(/\b([A-Z]{2,}\d{4,})\b/);
  return m?.[1]?.toUpperCase() ?? null;
}

export function extractCheckNumber(text: string): string | null {
  const m = text.match(/\b(?:check|chk|#)\s*(\d{3,})\b/i);
  return m?.[1] ?? null;
}
