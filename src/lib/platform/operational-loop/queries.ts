import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getLoopTransitionAudit, listFailedLoopTransitions } from "@/lib/platform/operational-loop/audit";
import { generateSchoolLoopGapReport } from "@/lib/platform/operational-loop/diagnostics";
import type { OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";
import { getActiveWorkflowInstance } from "@/lib/platform/workflow/persistence/instances";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const DAY_MS = 86400000;

/** Executive operational loop dashboard summary. */
export async function getOperationalLoopSummary(
  supabase: AuthClient,
  schoolId?: string
): Promise<OperationalLoopSummary> {
  const since = new Date(Date.now() - DAY_MS).toISOString();

  let studentQuery = supabase
    .from("students")
    .select("id")
    .eq("lifecycle_stage", "active");
  if (schoolId) studentQuery = studentQuery.eq("school_id", schoolId);
  const { data: students } = await studentQuery;

  let auditQuery = supabase
    .from("platform_audit_events")
    .select("action_type, metadata, created_at")
    .in("action_type", [
      "operational_loop_transition",
      "operational_loop_transition_failed",
    ])
    .gte("created_at", since);

  if (schoolId) auditQuery = auditQuery.eq("school_id", schoolId);

  // P004: stage fan-out, audit, gaps, and transition lists are independent after students load.
  const [instances, { data: recentAudits }, gapReports, recentTransitions, failedList] =
    await Promise.all([
      Promise.all(
        (students ?? []).map((s) =>
          getActiveWorkflowInstance(supabase, {
            domain: "sis",
            entityType: "student",
            entityId: s.id,
          })
        )
      ),
      auditQuery,
      schoolId ? generateSchoolLoopGapReport(supabase, schoolId, 50) : Promise.resolve([]),
      getLoopTransitionAudit(supabase, schoolId, 15),
      listFailedLoopTransitions(supabase, schoolId, 10),
    ]);

  const byStage = Object.fromEntries(
    OPERATIONAL_LOOP_STAGES.map((s) => [s, 0])
  ) as Record<(typeof OPERATIONAL_LOOP_STAGES)[number], number>;

  for (const instance of instances) {
    const stage = instance?.current_state_key;
    if (stage && stage in byStage) {
      byStage[stage as keyof typeof byStage]++;
    } else {
      byStage.scheduling++;
    }
  }

  const loopAudits = (recentAudits ?? []).filter(
    (r) => (r.metadata as Record<string, unknown>)?.operational_loop === true
  );

  const failedTransitions24h = loopAudits.filter(
    (r) => r.action_type === "operational_loop_transition_failed"
  ).length;

  const completedTransitions24h = loopAudits.filter(
    (r) => r.action_type === "operational_loop_transition"
  ).length;

  const openGaps = gapReports.reduce((sum, r) => sum + r.gaps.length, 0);

  return {
    activeStudents: students?.length ?? 0,
    byStage,
    failedTransitions24h,
    completedTransitions24h,
    openGaps,
    recentTransitions: [...failedList, ...recentTransitions].slice(0, 20),
  };
}
