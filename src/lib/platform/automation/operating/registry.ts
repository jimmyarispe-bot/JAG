import type { AutomationRule } from "@/lib/platform/automation/operating/types";

/** Process-local rule registry (central source of truth for Sprint 068). */
const ruleRegistry = new Map<string, AutomationRule>();

export function resetAutomationRegistryForTests(): void {
  ruleRegistry.clear();
}

export function registerAutomationRule(rule: AutomationRule): AutomationRule {
  ruleRegistry.set(rule.id, rule);
  return rule;
}

export function registerAutomationRules(rules: AutomationRule[]): void {
  for (const rule of rules) {
    registerAutomationRule(rule);
  }
}

export function getAutomationRule(id: string): AutomationRule | null {
  return ruleRegistry.get(id) ?? null;
}

export function listAutomationRules(): AutomationRule[] {
  return [...ruleRegistry.values()].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id.localeCompare(b.id);
  });
}

export function listEnabledAutomationRules(): AutomationRule[] {
  return listAutomationRules().filter((r) => r.enabled);
}

export function setAutomationRuleEnabled(
  id: string,
  enabled: boolean
): AutomationRule {
  const existing = ruleRegistry.get(id);
  if (!existing) {
    throw new Error(`Automation rule not found: ${id}`);
  }
  const updated = { ...existing, enabled };
  ruleRegistry.set(id, updated);
  return updated;
}
