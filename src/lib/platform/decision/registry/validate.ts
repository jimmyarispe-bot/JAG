import {
  getAllDecisionDefinitions,
  getDuplicateDecisionRegistrations,
} from "@/lib/platform/decision/registry/registry";
import type { DecisionDefinition } from "@/lib/platform/decision/types";
import { DECISION_ENGINE_MODES } from "@/lib/platform/decision/types";

export interface DecisionRegistryValidationIssue {
  code:
    | "duplicate_decision_type"
    | "missing_recommendation_option"
    | "orphan_rule_outcome"
    | "duplicate_rule_key"
    | "duplicate_outcome_key"
    | "duplicate_evidence_key"
    | "invalid_engine_mode"
    | "no_rules_for_rule_mode"
    | "no_recommendation_options";
  message: string;
}

export interface DecisionRegistryValidationResult {
  ok: boolean;
  issues: DecisionRegistryValidationIssue[];
}

function validateDefinition(
  definition: DecisionDefinition,
  issues: DecisionRegistryValidationIssue[]
): void {
  if (!DECISION_ENGINE_MODES.includes(definition.engineMode)) {
    issues.push({
      code: "invalid_engine_mode",
      message: `Decision "${definition.decisionType}" uses invalid engineMode "${definition.engineMode}"`,
    });
  }

  if (definition.recommendationOptions.length === 0) {
    issues.push({
      code: "no_recommendation_options",
      message: `Decision "${definition.decisionType}" has no recommendation options`,
    });
  }

  const outcomeKeys = new Set<string>();
  for (const option of definition.recommendationOptions) {
    if (outcomeKeys.has(option.outcomeKey)) {
      issues.push({
        code: "duplicate_outcome_key",
        message: `Decision "${definition.decisionType}" has duplicate outcome key "${option.outcomeKey}"`,
      });
    }
    outcomeKeys.add(option.outcomeKey);
  }

  const ruleKeys = new Set<string>();
  for (const rule of definition.rules) {
    if (ruleKeys.has(rule.key)) {
      issues.push({
        code: "duplicate_rule_key",
        message: `Decision "${definition.decisionType}" has duplicate rule key "${rule.key}"`,
      });
    }
    ruleKeys.add(rule.key);

    if (!outcomeKeys.has(rule.outcomeKey)) {
      issues.push({
        code: "orphan_rule_outcome",
        message: `Decision "${definition.decisionType}" rule "${rule.key}" references unknown outcome "${rule.outcomeKey}"`,
      });
    }
  }

  const evidenceKeys = new Set<string>();
  for (const requirement of definition.evidenceRequirements) {
    if (evidenceKeys.has(requirement.key)) {
      issues.push({
        code: "duplicate_evidence_key",
        message: `Decision "${definition.decisionType}" has duplicate evidence key "${requirement.key}"`,
      });
    }
    evidenceKeys.add(requirement.key);
  }

  if (definition.engineMode === "rule" && definition.rules.length === 0) {
    issues.push({
      code: "no_rules_for_rule_mode",
      message: `Decision "${definition.decisionType}" uses rule engineMode but defines no rules`,
    });
  }
}

/** Validate platform decision registry integrity — intended for build-time checks. */
export function validateDecisionRegistry(): DecisionRegistryValidationResult {
  const issues: DecisionRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateDecisionRegistrations()) {
    issues.push({
      code: "duplicate_decision_type",
      message: `Duplicate decision type "${duplicate}" registered`,
    });
  }

  const decisionTypes = new Set<string>();
  for (const definition of getAllDecisionDefinitions()) {
    if (decisionTypes.has(definition.decisionType)) {
      issues.push({
        code: "duplicate_decision_type",
        message: `Duplicate decision type "${definition.decisionType}"`,
      });
    }
    decisionTypes.add(definition.decisionType);
    validateDefinition(definition, issues);
  }

  return { ok: issues.length === 0, issues };
}
