/** Platform Automation Engine — B-08 Phase 1 foundation types */

import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export const AUTOMATION_DEFINITION_STATUSES = [
  "draft",
  "testing",
  "active",
  "archived",
] as const;
export type AutomationDefinitionStatus = (typeof AUTOMATION_DEFINITION_STATUSES)[number];

export const AUTOMATION_TRIGGER_TYPES = [
  "event",
  "workflow",
  "manual",
  "schedule",
] as const;
export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_ACTION_TYPES = [
  "create_task",
  "update_entity",
  "create_activity",
  "create_note",
  "apply_tag",
  "start_workflow",
  "send_notification",
  "send_email",
  "publish_event",
  "execute_decision",
] as const;
export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const AUTOMATION_CONDITION_TYPES = [
  "permission_check",
  "entity_state",
  "workflow_state",
  "decision_result",
  "relationship_exists",
  "tag_exists",
  "time_window",
] as const;
export type AutomationConditionType = (typeof AUTOMATION_CONDITION_TYPES)[number];

export const AUTOMATION_EXECUTION_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "retrying",
] as const;
export type AutomationExecutionStatus = (typeof AUTOMATION_EXECUTION_STATUSES)[number];

export const AUTOMATION_FAILURE_STRATEGIES = [
  "stop",
  "continue",
  "retry",
  "escalate",
] as const;
export type AutomationFailureStrategy = (typeof AUTOMATION_FAILURE_STRATEGIES)[number];

export interface AutomationStepDefinition {
  stepKey: string;
  actionKey: string;
  sortOrder: number;
  conditionKeys?: string[];
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RetryPolicyDefinition {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
}

export interface FailurePolicyDefinition {
  strategy: AutomationFailureStrategy;
  notifyRoles?: string[];
  metadata?: Record<string, unknown>;
}

/** Data-driven automation definition — domain modules register at import time. */
export interface AutomationDefinition {
  automationKey: string;
  name: string;
  description?: string;
  domain: string;
  version: number;
  status: AutomationDefinitionStatus;
  triggerKeys: string[];
  conditionKeys?: string[];
  steps: AutomationStepDefinition[];
  retryPolicy?: RetryPolicyDefinition;
  failurePolicy?: FailurePolicyDefinition;
  entityType?: string;
  sortOrder?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TriggerDefinition {
  triggerKey: string;
  name: string;
  description?: string;
  domain: string;
  triggerType: AutomationTriggerType;
  status: "draft" | "active" | "archived";
  eventType?: string;
  workflowKey?: string;
  transitionKey?: string;
  scheduleExpression?: string;
  config?: Record<string, unknown>;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface ActionDefinition {
  actionKey: string;
  name: string;
  description?: string;
  domain: string;
  actionType: AutomationActionType;
  status: "live" | "stub";
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface ConditionDefinition {
  conditionKey: string;
  name: string;
  description?: string;
  domain: string;
  conditionType: AutomationConditionType;
  config?: Record<string, unknown>;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface AutomationRegistrySnapshot {
  automations: AutomationDefinition[];
  triggers: TriggerDefinition[];
  actions: ActionDefinition[];
  conditions: ConditionDefinition[];
  domains: string[];
  registeredAt: string;
}

/** Runtime context assembled for each automation execution. */
export interface AutomationExecutionContext {
  executionId: string;
  automationKey: string;
  triggerKey: string;
  triggerType: AutomationTriggerType;
  organizationId: string | null;
  schoolId: string | null;
  actorId: string | null;
  entityType: string | null;
  entityId: string | null;
  facts: Record<string, unknown>;
  payload: Record<string, unknown>;
  supabase?: AuthClient;
  metadata: Record<string, unknown>;
}

export interface AutomationActionResult {
  actionKey: string;
  actionType: AutomationActionType;
  stepKey: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
  auditSummary?: string;
  output?: Record<string, unknown>;
}

export interface AutomationExecutionResult {
  executionId: string;
  automationKey: string;
  triggerKey: string;
  status: AutomationExecutionStatus;
  actions: AutomationActionResult[];
  conditionsPassed: boolean;
  attempt: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ExecuteAutomationInput {
  automationKey: string;
  triggerKey: string;
  triggerType: AutomationTriggerType;
  organizationId?: string | null;
  schoolId?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  facts?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  supabase?: AuthClient;
  metadata?: Record<string, unknown>;
  dryRun?: boolean;
}

export interface DispatchAutomationInput {
  triggerKey: string;
  triggerType: AutomationTriggerType;
  organizationId?: string | null;
  schoolId?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  facts?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  supabase?: AuthClient;
  metadata?: Record<string, unknown>;
  dryRun?: boolean;
}

export interface DispatchAutomationResult {
  triggerKey: string;
  triggerType: AutomationTriggerType;
  matchedAutomations: string[];
  results: AutomationExecutionResult[];
  errors: string[];
}

export type AutomationTriggerHandler = (
  input: DispatchAutomationInput
) => Promise<{ matchedAutomationKeys: string[] }>;

export type AutomationActionHandler = (
  context: AutomationExecutionContext,
  action: ActionDefinition,
  step: AutomationStepDefinition
) => Promise<AutomationActionResult>;

export type AutomationConditionEvaluator = (
  context: AutomationExecutionContext,
  condition: ConditionDefinition
) => Promise<boolean> | boolean;

export interface AutomationAuditEntry {
  auditId: string;
  executionId: string;
  automationKey: string;
  triggerKey: string;
  status: AutomationExecutionStatus;
  summary: string;
  result: AutomationExecutionResult;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}
