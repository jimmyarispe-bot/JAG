import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { executeWorkflowAction } from "./actions";
import { evaluateConditionGroups, evaluateConditionRule } from "./conditions";
import { nextNodes } from "./definition";
import { recordWorkflowActivity } from "./activity";
import type {
  ConditionRule,
  ExecutionStatus,
  WorkflowDefinitionJson,
  WorkflowEventContext,
  WorkflowNode,
  WorkflowRow,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface EngineRunResult {
  ok: boolean;
  executionId: string | null;
  status: ExecutionStatus;
  error?: string;
  skipped?: boolean;
}

async function findDuplicate(
  supabase: AuthClient,
  workflowId: string,
  dedupeKey: string | null | undefined
): Promise<boolean> {
  if (!dedupeKey) return false;
  const { data } = await supabase
    .from("platform_workflow_executions")
    .select("id")
    .eq("workflow_id", workflowId)
    .eq("dedupe_key", dedupeKey)
    .in("status", ["pending", "running", "completed", "retrying"])
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function insertStep(
  supabase: AuthClient,
  executionId: string,
  node: WorkflowNode,
  status: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  errorMessage?: string
) {
  const now = new Date().toISOString();
  await supabase.from("platform_workflow_execution_steps").insert({
    execution_id: executionId,
    node_id: node.id,
    node_type: node.type,
    status,
    started_at: now,
    finished_at: now,
    input,
    output,
    error_message: errorMessage ?? null,
  });
}

function evaluateNodeCondition(node: WorkflowNode, ctx: WorkflowEventContext): boolean {
  if (node.type !== "condition" && node.type !== "branch") return true;
  const rule = node.config as Partial<ConditionRule> & { field?: string };
  if (!rule.field || !rule.operator) {
    // Simple boolean config
    if (typeof node.config.expression === "boolean") return node.config.expression;
    return true;
  }
  return evaluateConditionRule(
    {
      id: node.id,
      field: rule.field,
      operator: rule.operator as ConditionRule["operator"],
      value: rule.value,
    },
    ctx
  );
}

async function walkGraph(
  supabase: AuthClient,
  executionId: string,
  definition: WorkflowDefinitionJson,
  ctx: WorkflowEventContext
): Promise<{ ok: boolean; errors: string[]; steps: number }> {
  const errors: string[] = [];
  let steps = 0;
  let currentIds = [definition.entryNodeId];
  const visited = new Set<string>();
  const maxSteps = 50;

  while (currentIds.length && steps < maxSteps) {
    const nextIds: string[] = [];
    for (const nodeId of currentIds) {
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      const node = definition.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      steps += 1;

      if (node.type === "trigger") {
        await insertStep(supabase, executionId, node, "completed", {}, { trigger: ctx.triggerKey });
        nextIds.push(...nextNodes(definition, node.id).map((n) => n.id));
        continue;
      }

      if (node.type === "end") {
        await insertStep(supabase, executionId, node, "completed", {}, { ended: true });
        continue;
      }

      if (node.type === "condition" || node.type === "branch") {
        const passed = evaluateNodeCondition(node, ctx);
        await insertStep(
          supabase,
          executionId,
          node,
          "completed",
          { field: node.config.field },
          { passed }
        );
        const branch = passed ? "true" : "false";
        const targets = nextNodes(definition, node.id, branch);
        if (!targets.length) {
          nextIds.push(...nextNodes(definition, node.id, "default").map((n) => n.id));
        } else {
          nextIds.push(...targets.map((n) => n.id));
        }
        continue;
      }

      if (node.type === "delay") {
        await insertStep(
          supabase,
          executionId,
          node,
          "completed",
          {},
          { waitMs: node.config.ms ?? node.config.seconds }
        );
        nextIds.push(...nextNodes(definition, node.id).map((n) => n.id));
        continue;
      }

      if (node.type === "action") {
        const result = await executeWorkflowAction(supabase, node, ctx);
        await insertStep(
          supabase,
          executionId,
          node,
          result.ok ? "completed" : "failed",
          { actionType: node.config.actionType },
          result.output ?? {},
          result.ok ? undefined : result.message
        );
        if (!result.ok) errors.push(result.message);
        nextIds.push(...nextNodes(definition, node.id).map((n) => n.id));
      }
    }
    currentIds = nextIds;
  }

  return { ok: errors.length === 0, errors, steps };
}

/**
 * Execute a single enabled workflow against an event context.
 * Handles dedupe, retries (caller may re-invoke), and dead-letter.
 */
export async function executeWorkflow(
  supabase: AuthClient,
  workflow: WorkflowRow,
  ctx: WorkflowEventContext,
  options: { attempt?: number; force?: boolean } = {}
): Promise<EngineRunResult> {
  if (!workflow.enabled || workflow.status !== "active") {
    return {
      ok: true,
      executionId: null,
      status: "skipped",
      skipped: true,
      error: "Workflow disabled or archived",
    };
  }

  const attempt = options.attempt ?? 1;
  const maxAttempts = workflow.max_retries + 1;

  if (!options.force && (await findDuplicate(supabase, workflow.id, ctx.dedupeKey))) {
    return {
      ok: true,
      executionId: null,
      status: "skipped",
      skipped: true,
      error: "Duplicate execution prevented",
    };
  }

  const definition = workflow.definition;
  if (!evaluateConditionGroups(definition.conditionGroups, ctx)) {
    const { data: skipped } = await supabase
      .from("platform_workflow_executions")
      .insert({
        workflow_id: workflow.id,
        organization_id: ctx.organizationId ?? workflow.organization_id,
        school_id: ctx.schoolId ?? workflow.school_id,
        trigger_key: ctx.triggerKey,
        trigger_event_id: ctx.activityEventId ?? null,
        dedupe_key: ctx.dedupeKey ?? null,
        status: "skipped",
        attempt,
        max_attempts: maxAttempts,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: 0,
        context: ctx as unknown as Record<string, unknown>,
        result: { reason: "conditions_not_met" },
      })
      .select("id")
      .single();

    return {
      ok: true,
      executionId: (skipped?.id as string) ?? null,
      status: "skipped",
      skipped: true,
    };
  }

  const startedAt = Date.now();
  const startedIso = new Date(startedAt).toISOString();

  const { data: execution, error: insertError } = await supabase
    .from("platform_workflow_executions")
    .insert({
      workflow_id: workflow.id,
      organization_id: ctx.organizationId ?? workflow.organization_id,
      school_id: ctx.schoolId ?? workflow.school_id,
      trigger_key: ctx.triggerKey,
      trigger_event_id: ctx.activityEventId ?? null,
      dedupe_key: ctx.dedupeKey ?? null,
      status: "running",
      attempt,
      max_attempts: maxAttempts,
      started_at: startedIso,
      context: {
        ...ctx,
        facts: ctx.facts ?? {},
        payload: ctx.payload ?? {},
      },
    })
    .select("id")
    .single();

  if (insertError || !execution) {
    // Unique violation → duplicate
    if (insertError?.message?.toLowerCase().includes("duplicate")) {
      return {
        ok: true,
        executionId: null,
        status: "skipped",
        skipped: true,
        error: "Duplicate execution prevented",
      };
    }
    return {
      ok: false,
      executionId: null,
      status: "failed",
      error: insertError?.message ?? "Unable to start execution",
    };
  }

  const executionId = execution.id as string;

  await recordWorkflowActivity(supabase, {
    eventType: "workflow.executed",
    title: "Workflow executed",
    summary: workflow.name,
    entityId: workflow.id,
    organizationId: ctx.organizationId ?? workflow.organization_id,
    schoolId: ctx.schoolId ?? workflow.school_id,
    actorUserId: ctx.actorUserId,
    payload: { executionId, triggerKey: ctx.triggerKey, attempt },
  });

  const walk = await walkGraph(supabase, executionId, definition, ctx);
  const finishedAt = Date.now();
  const durationMs = finishedAt - startedAt;

  let status: ExecutionStatus = walk.ok ? "completed" : "failed";
  if (!walk.ok && attempt < maxAttempts) {
    status = "retrying";
  } else if (!walk.ok && attempt >= maxAttempts) {
    status = "dead_letter";
  }

  await supabase
    .from("platform_workflow_executions")
    .update({
      status,
      finished_at: new Date(finishedAt).toISOString(),
      duration_ms: durationMs,
      error_message: walk.errors[0] ?? null,
      error_details: walk.errors.length ? { errors: walk.errors } : null,
      result: { steps: walk.steps, ok: walk.ok },
    })
    .eq("id", executionId);

  // Update workflow stats
  const statsPatch: Record<string, unknown> = {
    last_run_at: new Date(finishedAt).toISOString(),
    run_count: workflow.run_count + 1,
    updated_at: new Date().toISOString(),
  };
  if (status === "completed") {
    statsPatch.success_count = workflow.success_count + 1;
  } else if (status === "failed" || status === "dead_letter") {
    statsPatch.failure_count = workflow.failure_count + 1;
  }
  await supabase.from("platform_workflows").update(statsPatch).eq("id", workflow.id);

  if (status === "completed") {
    await recordWorkflowActivity(supabase, {
      eventType: "workflow.completed",
      title: "Workflow completed",
      summary: workflow.name,
      entityId: workflow.id,
      organizationId: ctx.organizationId ?? workflow.organization_id,
      schoolId: ctx.schoolId ?? workflow.school_id,
      actorUserId: ctx.actorUserId,
      payload: { executionId, durationMs },
    });
  } else if (status === "failed" || status === "dead_letter") {
    await recordWorkflowActivity(supabase, {
      eventType: "workflow.failed",
      title: "Workflow failed",
      summary: workflow.name,
      entityId: workflow.id,
      organizationId: ctx.organizationId ?? workflow.organization_id,
      schoolId: ctx.schoolId ?? workflow.school_id,
      actorUserId: ctx.actorUserId,
      payload: { executionId, errors: walk.errors, status },
    });
  }

  // Automatic retry for transient failure (new execution row; clear dedupe)
  if (status === "retrying") {
    const delay = workflow.retry_backoff_ms * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, Math.min(delay, 5000)));
    const refreshed: WorkflowRow = {
      ...workflow,
      run_count: workflow.run_count + 1,
      success_count: workflow.success_count,
      failure_count: workflow.failure_count,
    };
    return executeWorkflow(
      supabase,
      refreshed,
      {
        ...ctx,
        dedupeKey: ctx.dedupeKey ? `${ctx.dedupeKey}:retry:${attempt + 1}` : null,
      },
      { attempt: attempt + 1, force: true }
    );
  }

  return {
    ok: status === "completed",
    executionId,
    status,
    error: walk.errors[0],
  };
}

/** Dispatch all matching enabled workflows for a trigger. */
export async function dispatchWorkflowTrigger(
  supabase: AuthClient,
  ctx: WorkflowEventContext
): Promise<{ matched: number; results: EngineRunResult[] }> {
  let query = supabase
    .from("platform_workflows")
    .select("*")
    .eq("trigger_key", ctx.triggerKey)
    .eq("enabled", true)
    .eq("status", "active");

  if (ctx.schoolId) {
    query = query.or(`school_id.eq.${ctx.schoolId},school_id.is.null`);
  }

  const { data: workflows } = await query;
  const results: EngineRunResult[] = [];

  for (const row of workflows ?? []) {
    const workflow = {
      ...row,
      definition: row.definition as WorkflowDefinitionJson,
    } as WorkflowRow;

    const result = await executeWorkflow(supabase, workflow, ctx);
    results.push(result);
  }

  return { matched: results.length, results };
}

export async function rerunExecution(
  supabase: AuthClient,
  executionId: string
): Promise<EngineRunResult> {
  const { data: execution } = await supabase
    .from("platform_workflow_executions")
    .select("*")
    .eq("id", executionId)
    .maybeSingle();
  if (!execution) {
    return { ok: false, executionId: null, status: "failed", error: "Execution not found" };
  }

  const { data: workflow } = await supabase
    .from("platform_workflows")
    .select("*")
    .eq("id", execution.workflow_id)
    .maybeSingle();
  if (!workflow) {
    return { ok: false, executionId: null, status: "failed", error: "Workflow not found" };
  }

  const ctx = (execution.context ?? {}) as WorkflowEventContext;
  return executeWorkflow(
    supabase,
    { ...workflow, definition: workflow.definition as WorkflowDefinitionJson } as WorkflowRow,
    {
      ...ctx,
      triggerKey: execution.trigger_key,
      dedupeKey: null, // allow manual re-run
    },
    { force: true, attempt: 1 }
  );
}

export async function resolveManualActor(supabase: AuthClient) {
  return resolveActorUserId(supabase);
}
