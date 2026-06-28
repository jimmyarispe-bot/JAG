import {
  areAllActionHandlersRegistered,
  areAllConditionEvaluatorsRegistered,
  getAllActionDefinitions,
  getAllAutomationDefinitions,
  getAllConditionDefinitions,
  getAllTriggerDefinitions,
  getDuplicateActionRegistrations,
  getDuplicateAutomationRegistrations,
  getDuplicateConditionRegistrations,
  getDuplicateTriggerRegistrations,
  getRegisteredActionTypes,
  getRegisteredConditionTypes,
  getRegisteredTriggerTypes,
} from "@/lib/platform/automation/registry/registry";
import type {
  AutomationDefinition,
  TriggerDefinition,
} from "@/lib/platform/automation/engine-types";
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_TYPES,
  AUTOMATION_TRIGGER_TYPES,
} from "@/lib/platform/automation/engine-types";

export interface AutomationRegistryValidationIssue {
  code:
    | "duplicate_automation_key"
    | "duplicate_trigger_key"
    | "duplicate_action_key"
    | "duplicate_condition_key"
    | "unknown_trigger_ref"
    | "unknown_action_ref"
    | "unknown_condition_ref"
    | "missing_trigger_handler"
    | "missing_action_handler"
    | "missing_condition_evaluator"
    | "inactive_automation"
    | "empty_steps";
  message: string;
}

export interface AutomationRegistryValidationResult {
  ok: boolean;
  issues: AutomationRegistryValidationIssue[];
}

function validateAutomationDefinition(
  definition: AutomationDefinition,
  issues: AutomationRegistryValidationIssue[]
): void {
  if (!definition.steps.length) {
    issues.push({
      code: "empty_steps",
      message: `Automation "${definition.automationKey}" must declare at least one step`,
    });
  }

  const triggerKeys = new Set(getAllTriggerDefinitions().map((t) => t.triggerKey));
  for (const triggerKey of definition.triggerKeys) {
    if (!triggerKeys.has(triggerKey)) {
      issues.push({
        code: "unknown_trigger_ref",
        message: `Automation "${definition.automationKey}" references unknown trigger "${triggerKey}"`,
      });
    }
  }

  const actionKeys = new Set(getAllActionDefinitions().map((a) => a.actionKey));
  for (const step of definition.steps) {
    if (!actionKeys.has(step.actionKey)) {
      issues.push({
        code: "unknown_action_ref",
        message: `Automation "${definition.automationKey}" step "${step.stepKey}" references unknown action "${step.actionKey}"`,
      });
    }
  }

  const conditionKeys = new Set(getAllConditionDefinitions().map((c) => c.conditionKey));
  for (const conditionKey of definition.conditionKeys ?? []) {
    if (!conditionKeys.has(conditionKey)) {
      issues.push({
        code: "unknown_condition_ref",
        message: `Automation "${definition.automationKey}" references unknown condition "${conditionKey}"`,
      });
    }
  }

  for (const step of definition.steps) {
    for (const conditionKey of step.conditionKeys ?? []) {
      if (!conditionKeys.has(conditionKey)) {
        issues.push({
          code: "unknown_condition_ref",
          message: `Automation "${definition.automationKey}" step "${step.stepKey}" references unknown condition "${conditionKey}"`,
        });
      }
    }
  }
}

function validateTriggerDefinition(
  definition: TriggerDefinition,
  issues: AutomationRegistryValidationIssue[]
): void {
  if (!AUTOMATION_TRIGGER_TYPES.includes(definition.triggerType)) {
    issues.push({
      code: "unknown_trigger_ref",
      message: `Trigger "${definition.triggerKey}" uses invalid triggerType "${definition.triggerType}"`,
    });
  }
}

/** Validate platform automation registry integrity — intended for build-time checks. */
export function validateAutomationRegistry(): AutomationRegistryValidationResult {
  const issues: AutomationRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateAutomationRegistrations()) {
    issues.push({
      code: "duplicate_automation_key",
      message: `Duplicate automation key "${duplicate}" registered`,
    });
  }

  for (const duplicate of getDuplicateTriggerRegistrations()) {
    issues.push({
      code: "duplicate_trigger_key",
      message: `Duplicate trigger key "${duplicate}" registered`,
    });
  }

  for (const duplicate of getDuplicateActionRegistrations()) {
    issues.push({
      code: "duplicate_action_key",
      message: `Duplicate action key "${duplicate}" registered`,
    });
  }

  for (const duplicate of getDuplicateConditionRegistrations()) {
    issues.push({
      code: "duplicate_condition_key",
      message: `Duplicate condition key "${duplicate}" registered`,
    });
  }

  const automationKeys = new Set<string>();
  for (const definition of getAllAutomationDefinitions()) {
    if (automationKeys.has(definition.automationKey)) {
      issues.push({
        code: "duplicate_automation_key",
        message: `Duplicate automation key "${definition.automationKey}"`,
      });
    }
    automationKeys.add(definition.automationKey);
    validateAutomationDefinition(definition, issues);
  }

  const triggerKeys = new Set<string>();
  for (const definition of getAllTriggerDefinitions()) {
    if (triggerKeys.has(definition.triggerKey)) {
      issues.push({
        code: "duplicate_trigger_key",
        message: `Duplicate trigger key "${definition.triggerKey}"`,
      });
    }
    triggerKeys.add(definition.triggerKey);
    validateTriggerDefinition(definition, issues);
  }

  for (const triggerType of AUTOMATION_TRIGGER_TYPES) {
    if (triggerType === "schedule") continue;
    if (!getRegisteredTriggerTypes().includes(triggerType)) {
      issues.push({
        code: "missing_trigger_handler",
        message: `Trigger handler for type "${triggerType}" is not registered`,
      });
    }
  }

  for (const actionType of AUTOMATION_ACTION_TYPES) {
    if (!getRegisteredActionTypes().includes(actionType)) {
      issues.push({
        code: "missing_action_handler",
        message: `Action handler for type "${actionType}" is not registered`,
      });
    }
  }

  for (const conditionType of AUTOMATION_CONDITION_TYPES) {
    if (!getRegisteredConditionTypes().includes(conditionType)) {
      issues.push({
        code: "missing_condition_evaluator",
        message: `Condition evaluator for type "${conditionType}" is not registered`,
      });
    }
  }

  if (!areAllActionHandlersRegistered()) {
    issues.push({
      code: "missing_action_handler",
      message: "Not all automation action types have registered handlers",
    });
  }

  if (!areAllConditionEvaluatorsRegistered()) {
    issues.push({
      code: "missing_condition_evaluator",
      message: "Not all automation condition types have registered evaluators",
    });
  }

  return { ok: issues.length === 0, issues };
}
