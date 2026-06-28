import type {
  AutomationConditionEvaluator,
  AutomationConditionType,
  ConditionDefinition,
} from "@/lib/platform/automation/engine-types";
import { AUTOMATION_CONDITION_TYPES } from "@/lib/platform/automation/engine-types";

const CONDITION_REGISTRY = new Map<string, ConditionDefinition>();
const DUPLICATE_CONDITION_KEYS: string[] = [];
const CONDITION_EVALUATORS = new Map<AutomationConditionType, AutomationConditionEvaluator>();

export function registerConditionDefinition(definition: ConditionDefinition): void {
  if (CONDITION_REGISTRY.has(definition.conditionKey)) {
    DUPLICATE_CONDITION_KEYS.push(definition.conditionKey);
    return;
  }
  CONDITION_REGISTRY.set(definition.conditionKey, definition);
}

export function registerConditionDefinitions(definitions: ConditionDefinition[]): void {
  for (const definition of definitions) {
    registerConditionDefinition(definition);
  }
}

export function getConditionDefinition(
  conditionKey: string
): ConditionDefinition | undefined {
  return CONDITION_REGISTRY.get(conditionKey);
}

export function getAllConditionDefinitions(): ConditionDefinition[] {
  return [...CONDITION_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getDuplicateConditionRegistrations(): string[] {
  return [...DUPLICATE_CONDITION_KEYS];
}

export function isKnownConditionKey(conditionKey: string): boolean {
  return CONDITION_REGISTRY.has(conditionKey);
}

export function registerConditionEvaluator(
  conditionType: AutomationConditionType,
  evaluator: AutomationConditionEvaluator
): void {
  CONDITION_EVALUATORS.set(conditionType, evaluator);
}

export function getConditionEvaluator(
  conditionType: AutomationConditionType
): AutomationConditionEvaluator | undefined {
  return CONDITION_EVALUATORS.get(conditionType);
}

export function getRegisteredConditionTypes(): AutomationConditionType[] {
  return [...CONDITION_EVALUATORS.keys()];
}

export function areAllConditionEvaluatorsRegistered(): boolean {
  return AUTOMATION_CONDITION_TYPES.every((type) => CONDITION_EVALUATORS.has(type));
}
