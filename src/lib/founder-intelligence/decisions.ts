import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFounderActivity } from "./activity";
import type { DecisionStatus, FounderDecisionRecord, FounderRecommendation } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function mapDecision(row: Record<string, unknown>): FounderDecisionRecord {
  return {
    id: String(row.id),
    auditId: String(row.audit_id ?? ""),
    insightId: (row.insight_id as string | null) ?? null,
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: row.status as DecisionStatus,
    priority: Number(row.priority ?? 50),
    impact: (row.impact as string | null) ?? null,
    confidence: Number(row.confidence ?? 0.7),
    delegatedTo: (row.delegated_to as string | null) ?? null,
    scheduledFor: (row.scheduled_for as string | null) ?? null,
    relatedEntities:
      (row.related_entities as FounderDecisionRecord["relatedEntities"]) ?? [],
    suggestedActions: (row.suggested_actions as string[]) ?? [],
    history:
      (row.history as FounderDecisionRecord["history"]) ?? [],
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function listFounderDecisions(
  supabase: AuthClient,
  options?: { organizationId?: string | null; status?: DecisionStatus }
): Promise<FounderDecisionRecord[]> {
  let q = supabase
    .from("founder_decisions")
    .select("*")
    .order("priority", { ascending: false })
    .limit(50);
  if (options?.organizationId) q = q.eq("organization_id", options.organizationId);
  if (options?.status) q = q.eq("status", options.status);
  const { data } = await q;
  return (data ?? []).map((r) => mapDecision(r as Record<string, unknown>));
}

export async function createDecisionFromRecommendation(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    schoolId?: string | null;
    recommendation: FounderRecommendation;
  }
): Promise<{ ok: true; decisionId: string } | { ok: false; error: string }> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("founder_decisions")
    .insert({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      title: input.recommendation.title,
      description: input.recommendation.summary,
      status: "pending",
      priority: input.recommendation.priority,
      impact: input.recommendation.impact,
      confidence: input.recommendation.confidence,
      related_entities: input.recommendation.relatedEntities,
      suggested_actions: input.recommendation.suggestedActions,
      history: [
        {
          at: new Date().toISOString(),
          action: "created",
          actorUserId,
          note: "From recommendation engine",
        },
      ],
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Create failed" };
  return { ok: true, decisionId: data.id };
}

export type DecisionAction =
  | "approve"
  | "dismiss"
  | "delegate"
  | "schedule"
  | "track"
  | "resolve";

const ACTION_STATUS: Record<DecisionAction, DecisionStatus> = {
  approve: "approved",
  dismiss: "dismissed",
  delegate: "delegated",
  schedule: "scheduled",
  track: "tracking",
  resolve: "resolved",
};

const ACTION_EVENT: Record<
  DecisionAction,
  | "founder.decision.approved"
  | "founder.decision.dismissed"
  | "founder.decision.delegated"
  | "founder.decision.scheduled"
  | "founder.decision.resolved"
  | null
> = {
  approve: "founder.decision.approved",
  dismiss: "founder.decision.dismissed",
  delegate: "founder.decision.delegated",
  schedule: "founder.decision.scheduled",
  track: null,
  resolve: "founder.decision.resolved",
};

export async function applyDecisionAction(
  supabase: AuthClient,
  input: {
    decisionId: string;
    action: DecisionAction;
    note?: string;
    delegatedTo?: string;
    scheduledFor?: string;
    triggerWorkflow?: boolean;
  }
): Promise<{ ok: true; decision: FounderDecisionRecord } | { ok: false; error: string }> {
  const { data: row } = await supabase
    .from("founder_decisions")
    .select("*")
    .eq("id", input.decisionId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Decision not found" };

  const actorUserId = await resolveActorUserId(supabase);
  const status = ACTION_STATUS[input.action];
  const history = [
    ...((row.history as FounderDecisionRecord["history"]) ?? []),
    {
      at: new Date().toISOString(),
      action: input.action,
      actorUserId,
      note: input.note ?? null,
    },
  ];

  const { data, error } = await supabase
    .from("founder_decisions")
    .update({
      status,
      delegated_to: input.delegatedTo ?? row.delegated_to,
      scheduled_for: input.scheduledFor ?? row.scheduled_for,
      resolution_notes: input.note ?? row.resolution_notes,
      decided_by: actorUserId,
      decided_at: new Date().toISOString(),
      history,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.decisionId)
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Update failed" };

  const eventType = ACTION_EVENT[input.action];
  if (eventType) {
    await recordFounderActivity(supabase, {
      eventType,
      title: `Decision ${input.action}`,
      summary: String(data.title),
      entityId: data.id,
      entityType: "founder_decision",
      organizationId: data.organization_id,
      schoolId: data.school_id,
      actorUserId,
      sourceTable: "founder_decisions",
      sourceId: data.id,
      payload: { action: input.action, triggerWorkflow: Boolean(input.triggerWorkflow) },
    });
  }

  // Workflow side-effects only after explicit approval (unless automatic flag set)
  if (input.action === "approve" && input.triggerWorkflow !== false) {
    try {
      const { executeApprovedDecisionWorkflow } = await import("./workflows");
      await executeApprovedDecisionWorkflow(supabase, mapDecision(data as Record<string, unknown>));
    } catch {
      // best-effort
    }
  }

  // Decision feedback loop → JAG Intelligence Engine learning records
  try {
    const { syncFounderDecisionFeedback } = await import("@/lib/jag-intelligence/api");
    await syncFounderDecisionFeedback(supabase, {
      organizationId: data.organization_id,
      founderDecisionId: data.id,
      status,
      notes: input.note,
    });
  } catch {
    // best-effort
  }

  return { ok: true, decision: mapDecision(data as Record<string, unknown>) };
}
