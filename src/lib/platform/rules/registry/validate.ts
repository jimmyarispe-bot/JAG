import type { RuleSetDefinition } from "@/lib/platform/rules/types";
import { RULE_EVALUATION_MODES, RULE_SET_STATUSES } from "@/lib/platform/rules/types";
import {
  getAllRuleSets,
  getDuplicateRuleSetRegistrations,
} from "@/lib/platform/rules/registry/registry";

export interface RuleRegistryValidationIssue {
  code:
    | "duplicate_rule_set_key"
    | "duplicate_rule_key"
    | "duplicate_outcome_key"
    | "orphan_rule_outcome"
    | "invalid_evaluation_mode"
    | "invalid_status"
    | "no_rules"
    | "no_outcomes";
  message: string;
}

export interface RuleRegistryValidationResult {
  ok: boolean;
  issues: RuleRegistryValidationIssue[];
}

function validateRuleSet(definition: RuleSetDefinition, issues: RuleRegistryValidationIssue[]): void {
  if (!RULE_SET_STATUSES.includes(definition.status)) {
    issues.push({
      code: "invalid_status",
      message: `Rule set "${definition.ruleSetKey}" uses invalid status "${definition.status}"`,
    });
  }

  if (!RULE_EVALUATION_MODES.includes(definition.evaluationMode)) {
    issues.push({
      code: "invalid_evaluation_mode",
      message: `Rule set "${definition.ruleSetKey}" uses invalid evaluationMode "${definition.evaluationMode}"`,
    });
  }

  if (definition.outcomes.length === 0) {
    issues.push({
      code: "no_outcomes",
      message: `Rule set "${definition.ruleSetKey}" defines no outcomes`,
    });
  }

  if (definition.rules.length === 0) {
    issues.push({
      code: "no_rules",
      message: `Rule set "${definition.ruleSetKey}" defines no rules`,
    });
  }

  const outcomeKeys = new Set<string>();
  for (const outcome of definition.outcomes) {
    if (outcomeKeys.has(outcome.outcomeKey)) {
      issues.push({
        code: "duplicate_outcome_key",
        message: `Rule set "${definition.ruleSetKey}" has duplicate outcome "${outcome.outcomeKey}"`,
      });
    }
    outcomeKeys.add(outcome.outcomeKey);
  }

  const ruleKeys = new Set<string>();
  for (const rule of definition.rules) {
    if (ruleKeys.has(rule.ruleKey)) {
      issues.push({
        code: "duplicate_rule_key",
        message: `Rule set "${definition.ruleSetKey}" has duplicate rule "${rule.ruleKey}"`,
      });
    }
    ruleKeys.add(rule.ruleKey);

    if (!outcomeKeys.has(rule.outcomeKey)) {
      issues.push({
        code: "orphan_rule_outcome",
        message: `Rule set "${definition.ruleSetKey}" rule "${rule.ruleKey}" references unknown outcome "${rule.outcomeKey}"`,
      });
    }
  }
}

export function validateRuleRegistry(): RuleRegistryValidationResult {
  const issues: RuleRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateRuleSetRegistrations()) {
    issues.push({
      code: "duplicate_rule_set_key",
      message: `Duplicate rule set key "${duplicate}" registered`,
    });
  }

  const ruleSetKeys = new Set<string>();
  for (const definition of getAllRuleSets()) {
    if (ruleSetKeys.has(definition.ruleSetKey)) {
      issues.push({
        code: "duplicate_rule_set_key",
        message: `Duplicate rule set key "${definition.ruleSetKey}"`,
      });
    }
    ruleSetKeys.add(definition.ruleSetKey);
    validateRuleSet(definition, issues);
  }

  return { ok: issues.length === 0, issues };
}
