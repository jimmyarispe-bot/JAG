import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { listRules, upsertRule, upsertTransaction } from "../store";
import type { BankTransaction, CategorizationRule } from "../types";

export function createCategorizationRule(input: {
  organizationId: string;
  userId: string;
  name: string;
  matchContains: string;
  category: string;
  vendorId?: string | null;
  customerId?: string | null;
}): CategorizationRule | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  return upsertRule({
    id: `brule:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    matchContains: input.matchContains.toLowerCase(),
    category: input.category,
    vendorId: input.vendorId ?? null,
    customerId: input.customerId ?? null,
    active: true,
  });
}

export function applyRulesToTransaction(txn: BankTransaction): BankTransaction {
  const rules = listRules(txn.organizationId).filter((r) => r.active);
  const hay = `${txn.description} ${txn.merchantName ?? ""}`.toLowerCase();
  for (const rule of rules) {
    if (!hay.includes(rule.matchContains)) continue;
    return upsertTransaction({
      ...txn,
      category: rule.category,
      vendorId: rule.vendorId ?? txn.vendorId,
      customerId: rule.customerId ?? txn.customerId,
    });
  }
  return txn;
}

export function detectRecurringPattern(input: {
  organizationId: string;
  descriptions: readonly string[];
}): readonly { pattern: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of input.descriptions) {
    const key = d.trim().toLowerCase().slice(0, 40);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.freeze(
    [...counts.entries()]
      .filter(([, c]) => c >= 2)
      .map(([pattern, count]) => Object.freeze({ pattern, count }))
  );
}

export { listRules };
