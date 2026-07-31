import type { InsightRule } from "@/lib/executive-intelligence/insights/types";

export type InsightRuleRegistry = {
  register(rule: InsightRule): void;
  get(ruleId: string): InsightRule | null;
  list(): readonly InsightRule[];
  listByDomain(domain: InsightRule["domain"]): readonly InsightRule[];
};

export function createInsightRuleRegistry(
  initial: readonly InsightRule[] = []
): InsightRuleRegistry {
  const byId = new Map<string, InsightRule>();
  for (const rule of initial) {
    byId.set(rule.id, rule);
  }
  return {
    register(rule) {
      byId.set(rule.id, rule);
    },
    get(ruleId) {
      return byId.get(ruleId) ?? null;
    },
    list() {
      return Object.freeze([...byId.values()]);
    },
    listByDomain(domain) {
      return Object.freeze(
        [...byId.values()].filter((r) => r.domain === domain)
      );
    },
  };
}
