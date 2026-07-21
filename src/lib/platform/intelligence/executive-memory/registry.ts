/**
 * Sprint 063 — retention / recall extension registry.
 */

import type { RetentionRule } from "@/lib/platform/intelligence/executive-memory/types";
import { DEFAULT_RETENTION_RULES } from "@/lib/platform/intelligence/executive-memory/retention/policies";

export class ExecutiveMemoryRegistry {
  private readonly retentionRules = new Map<string, RetentionRule>();

  constructor(rules: RetentionRule[] = DEFAULT_RETENTION_RULES) {
    for (const rule of rules) this.registerRetentionRule(rule);
  }

  registerRetentionRule(rule: RetentionRule): void {
    this.retentionRules.set(rule.id, rule);
  }

  listRetentionRules(): RetentionRule[] {
    return [...this.retentionRules.values()];
  }
}

export function createDefaultMemoryRegistry(
  rules?: RetentionRule[]
): ExecutiveMemoryRegistry {
  return new ExecutiveMemoryRegistry(rules);
}
