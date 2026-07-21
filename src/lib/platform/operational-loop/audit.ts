import type { createAuthClient } from "@/lib/supabase/server-auth";
import { LOOP_AUDIT_EVENT_COLS } from "@/lib/platform/operational-loop/audit-projections";
import type { LoopTransitionAuditEntry } from "@/lib/platform/operational-loop/types";
import { OPERATIONAL_LOOP_TRANSITION_KEYS } from "@/lib/platform/operational-loop/types";
import type { OperationalLoopTransitionKey } from "@/lib/platform/operational-loop/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function mapAuditRow(row: Record<string, unknown>): LoopTransitionAuditEntry {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const sideEffects = (meta.sideEffects ?? []) as LoopTransitionAuditEntry["sideEffects"];
  return {
    id: row.id as string,
    attemptId: (meta.attemptId as string) ?? (row.id as string),
    transitionKey: meta.transitionKey as OperationalLoopTransitionKey,
    studentId: row.entity_id as string,
    schoolId: (row.school_id as string) ?? null,
    status:
      meta.status === "failed"
        ? "failed"
        : meta.status === "retrying"
          ? "retrying"
          : "completed",
    fromStage: meta.fromStage as LoopTransitionAuditEntry["fromStage"],
    toStage: meta.toStage as LoopTransitionAuditEntry["toStage"],
    sideEffects,
    errors: (meta.errors as string[]) ?? [],
    actorUserId: (row.actor_user_id as string) ?? null,
    createdAt: row.created_at as string,
    metadata: meta,
  };
}

/** Full transition audit trail for a student. */
export async function getStudentLoopAuditTrail(
  supabase: AuthClient,
  studentId: string,
  limit = 50
): Promise<LoopTransitionAuditEntry[]> {
  const { data } = await supabase
    .from("platform_audit_events")
    .select(LOOP_AUDIT_EVENT_COLS)
    .eq("entity_type", "student")
    .eq("entity_id", studentId)
    .in("action_type", [
      "operational_loop_transition",
      "operational_loop_transition_failed",
      "operational_loop_transition_recovered",
    ])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .filter((r) => (r.metadata as Record<string, unknown>)?.operational_loop === true)
    .map((r) => mapAuditRow(r as Record<string, unknown>));
}

/** School-wide recent transition audit entries. */
export async function getLoopTransitionAudit(
  supabase: AuthClient,
  schoolId?: string,
  limit = 30
): Promise<LoopTransitionAuditEntry[]> {
  let q = supabase
    .from("platform_audit_events")
    .select(LOOP_AUDIT_EVENT_COLS)
    .in("action_type", [
      "operational_loop_transition",
      "operational_loop_transition_failed",
      "operational_loop_transition_recovered",
    ])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (schoolId) q = q.eq("school_id", schoolId);

  const { data } = await q;
  return (data ?? [])
    .filter((r) => (r.metadata as Record<string, unknown>)?.operational_loop === true)
    .map((r) => mapAuditRow(r as Record<string, unknown>));
}

/** List failed transitions eligible for recovery. */
export async function listFailedLoopTransitions(
  supabase: AuthClient,
  schoolId?: string,
  limit = 25
): Promise<LoopTransitionAuditEntry[]> {
  const entries = await getLoopTransitionAudit(supabase, schoolId, limit * 2);
  return entries
    .filter((e) => e.status === "failed" && e.metadata.recoverable !== false)
    .slice(0, limit);
}

/** Which transitions have completed for a student. */
export async function getCompletedTransitionKeys(
  supabase: AuthClient,
  studentId: string
): Promise<Set<OperationalLoopTransitionKey>> {
  const trail = await getStudentLoopAuditTrail(supabase, studentId, 100);
  const completed = new Set<OperationalLoopTransitionKey>();
  for (const entry of trail) {
    if (entry.status === "completed" && OPERATIONAL_LOOP_TRANSITION_KEYS.includes(entry.transitionKey)) {
      completed.add(entry.transitionKey);
    }
  }
  return completed;
}
