import { recordActivity } from "@/lib/platform/activity/record";
import { executeDecision } from "@/lib/platform/decision/engine/execute";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { createNote } from "@/lib/platform/notes/actions";
import { applyTags } from "@/lib/platform/tags/actions";
import { createWorkflowTask } from "@/lib/platform/workflow/persistence/tasks";
import type {
  AutomationActionHandler,
  AutomationActionResult,
  AutomationExecutionContext,
  AutomationStepDefinition,
  ActionDefinition,
} from "@/lib/platform/automation/engine-types";

function baseResult(
  action: ActionDefinition,
  step: AutomationStepDefinition,
  overrides: Partial<AutomationActionResult>
): AutomationActionResult {
  return {
    actionKey: action.actionKey,
    actionType: action.actionType,
    stepKey: step.stepKey,
    success: false,
    ...overrides,
  };
}

function requireSupabase(context: AutomationExecutionContext): NonNullable<AutomationExecutionContext["supabase"]> | null {
  return context.supabase ?? null;
}

export const createTaskActionHandler: AutomationActionHandler = async (context, action, step) => {
  const supabase = requireSupabase(context);
  const config = step.config ?? {};
  const instanceId = String(config.instanceId ?? context.payload.instanceId ?? context.executionId);

  if (!supabase) {
    return baseResult(action, step, {
      success: true,
      auditSummary: "Task created (skeleton — no supabase)",
      output: { taskId: `task_${Date.now()}`, instanceId },
    });
  }

  const result = await createWorkflowTask(supabase, {
    instanceId,
    taskName: String(config.title ?? config.taskName ?? "Automation task"),
    stateKey: config.stateKey ? String(config.stateKey) : null,
    transitionKey: config.transitionKey ? String(config.transitionKey) : null,
    actionKey: step.actionKey,
    dueAt: config.dueAt ? String(config.dueAt) : null,
    assignedRoles: Array.isArray(config.assignedRoles)
      ? (config.assignedRoles as string[])
      : config.assignedRole
        ? [String(config.assignedRole)]
        : [],
    metadata: { automationKey: context.automationKey, stepKey: step.stepKey },
  });

  if (result.error) {
    return baseResult(action, step, { error: result.error });
  }

  return baseResult(action, step, {
    success: true,
    auditSummary: `Task created: ${config.title ?? "Automation task"}`,
    output: { taskId: result.task?.id, instanceId },
  });
};

export const updateEntityActionHandler: AutomationActionHandler = async (context, action, step) => {
  const supabase = requireSupabase(context);
  const config = step.config ?? {};
  const table = String(config.table ?? context.entityType ?? "");
  const entityId = String(config.entityId ?? context.entityId ?? "");

  if (!supabase || !table || !entityId) {
    return baseResult(action, step, {
      success: true,
      auditSummary: "Entity update recorded (skeleton)",
      output: { table, entityId, patch: config.patch ?? {} },
    });
  }

  const patch = (config.patch as Record<string, unknown>) ?? {};
  const { error } = await supabase.from(table).update(patch).eq("id", entityId);

  if (error) {
    return baseResult(action, step, { error: error.message });
  }

  return baseResult(action, step, {
    success: true,
    auditSummary: `Entity updated: ${table}/${entityId}`,
    output: { table, entityId },
  });
};

export const createActivityActionHandler: AutomationActionHandler = async (context, action, step) => {
  const supabase = requireSupabase(context);
  const config = step.config ?? {};

  if (!supabase || !context.organizationId) {
    return baseResult(action, step, {
      success: true,
      auditSummary: "Activity recorded (skeleton)",
      output: { eventType: config.eventType },
    });
  }

  const result = await recordActivity(supabase, {
    eventType: String(config.eventType ?? "workflow"),
    moduleKey: String(config.moduleKey ?? "platform"),
    entityType: context.entityType ?? "automation",
    entityId: context.entityId ?? context.executionId,
    title: String(config.title ?? "Automation activity"),
    summary: String(config.summary ?? `Automation ${context.automationKey} executed`),
    organizationId: context.organizationId,
    schoolId: context.schoolId,
    actorUserId: context.actorId,
    payload: { automationKey: context.automationKey, stepKey: step.stepKey },
  });

  return baseResult(action, step, {
    success: true,
    auditSummary: "Activity event recorded",
    output: { activityId: result.id },
  });
};

export const createNoteActionHandler: AutomationActionHandler = async (context, action, step) => {
  const supabase = requireSupabase(context);
  const config = step.config ?? {};

  if (!supabase || !context.organizationId || !context.entityType || !context.entityId) {
    return baseResult(action, step, {
      success: true,
      auditSummary: "Note created (skeleton)",
      output: { body: config.body },
    });
  }

  const result = await createNote(supabase, {
    organizationId: context.organizationId,
    schoolId: context.schoolId,
    entityType: context.entityType,
    entityId: context.entityId,
    body: String(config.body ?? "Automation note"),
    category: (config.category as "general") ?? "general",
    authorUserId: context.actorId ?? context.organizationId,
    source: "integration",
    metadata: { automationKey: context.automationKey },
  });

  if (result.error) {
    return baseResult(action, step, { error: result.error });
  }

  return baseResult(action, step, {
    success: true,
    auditSummary: "Note created",
    output: { noteId: result.id },
  });
};

export const applyTagActionHandler: AutomationActionHandler = async (context, action, step) => {
  const supabase = requireSupabase(context);
  const config = step.config ?? {};

  if (!supabase || !context.organizationId || !context.entityType || !context.entityId) {
    return baseResult(action, step, {
      success: true,
      auditSummary: "Tag applied (skeleton)",
      output: { tagIds: config.tagIds },
    });
  }

  const tagIds = Array.isArray(config.tagIds)
    ? (config.tagIds as string[])
    : config.tagId
      ? [String(config.tagId)]
      : [];

  if (!tagIds.length) {
    return baseResult(action, step, { error: "No tagIds configured for apply_tag action" });
  }

  const result = await applyTags(supabase, {
    organizationId: context.organizationId,
    entityType: context.entityType,
    entityId: context.entityId,
    tagIds,
    source: "automation",
    appliedBy: context.actorId,
  });

  if (result.error) {
    return baseResult(action, step, { error: result.error });
  }

  return baseResult(action, step, {
    success: true,
    auditSummary: "Tags applied",
    output: { applied: result.applied },
  });
};

export const startWorkflowActionHandler: AutomationActionHandler = async (context, action, step) => {
  const config = step.config ?? {};
  const workflowKey = String(config.workflowKey ?? "");

  if (!workflowKey) {
    return baseResult(action, step, { error: "workflowKey is required for start_workflow action" });
  }

  return baseResult(action, step, {
    success: true,
    auditSummary: `Workflow start requested: ${workflowKey}`,
    output: {
      workflowKey,
      entityType: context.entityType,
      entityId: context.entityId,
      skeleton: true,
    },
  });
};

export const sendNotificationActionHandler: AutomationActionHandler = async (context, action, step) => {
  return baseResult(action, step, {
    success: false,
    error: 'Action "send_notification" is a stub — notification delivery deferred to Phase 2',
  });
};

export const sendEmailActionHandler: AutomationActionHandler = async (context, action, step) => {
  const config = step.config ?? {};
  const to = String(config.to ?? config.email ?? "").trim();
  const subject = String(config.subject ?? "AcademyOS notification").trim();
  const body = String(config.body ?? config.message ?? "").trim();

  if (!to || !to.includes("@")) {
    return baseResult(action, step, { error: "send_email requires config.to (email)" });
  }
  if (!body) {
    return baseResult(action, step, { error: "send_email requires config.body" });
  }

  const { sendSystemNotificationEmail } = await import("@/lib/platform/email");
  const result = await sendSystemNotificationEmail({ to, subject, body });

  return baseResult(action, step, {
    success: result.success,
    auditSummary: result.success
      ? `Email sent via ${result.provider}`
      : `Email failed via ${result.provider}`,
    output: { provider: result.provider, messageId: result.messageId },
    error: result.error,
  });
};

export const publishEventActionHandler: AutomationActionHandler = async (context, action, step) => {
  const config = step.config ?? {};
  const eventType = String(config.eventType ?? "platform.entity.updated");

  const result = await publishEvent({
    eventType,
    entityType: context.entityType ?? "automation",
    entityId: context.entityId ?? context.executionId,
    organizationId: context.organizationId,
    schoolId: context.schoolId,
    actorId: context.actorId,
    payload: {
      automationKey: context.automationKey,
      triggerKey: context.triggerKey,
      ...(config.payload as Record<string, unknown> ?? {}),
    },
    metadata: { source: "automation_engine", stepKey: step.stepKey },
  });

  return baseResult(action, step, {
    success: result.dispatched,
    auditSummary: `Event published: ${eventType}`,
    output: { eventId: result.eventId, dispatchMode: result.dispatchMode },
    error: result.errors.length ? result.errors.join("; ") : undefined,
  });
};

export const executeDecisionActionHandler: AutomationActionHandler = async (context, action, step) => {
  const config = step.config ?? {};
  const decisionType = String(config.decisionType ?? "");

  if (!decisionType) {
    return baseResult(action, step, { error: "decisionType is required for execute_decision action" });
  }

  const result = await executeDecision({
    decisionType,
    inputs: {
      ...(context.facts ?? {}),
      ...(config.inputs as Record<string, unknown> ?? {}),
    },
    entityType: context.entityType ?? undefined,
    entityId: context.entityId ?? undefined,
    organizationId: context.organizationId ?? undefined,
    schoolId: context.schoolId ?? undefined,
    actorUserId: context.actorId ?? undefined,
  });

  return baseResult(action, step, {
    success: true,
    auditSummary: `Decision executed: ${decisionType}`,
    output: {
      executionId: result.executionId,
      outcomeKey: result.recommendation.outcomeKey,
      confidence: result.confidence.level,
    },
  });
};

export const DEFAULT_ACTION_HANDLERS = {
  create_task: createTaskActionHandler,
  update_entity: updateEntityActionHandler,
  create_activity: createActivityActionHandler,
  create_note: createNoteActionHandler,
  apply_tag: applyTagActionHandler,
  start_workflow: startWorkflowActionHandler,
  send_notification: sendNotificationActionHandler,
  send_email: sendEmailActionHandler,
  publish_event: publishEventActionHandler,
  execute_decision: executeDecisionActionHandler,
} as const;
