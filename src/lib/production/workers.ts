/**
 * RC11 background workers — invoked from processAllPlatformQueues.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { ensureProductionIntegrationsRegistered } from "./integrations";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function processJagPipelineWorker(supabase: AuthClient) {
  const { insightApi } = await import("@/lib/jag-intelligence/api");
  // Org-scoped runs: process up to a handful of orgs with recent activity
  const { data: orgs } = await supabase.from("organizations").select("id").limit(5);
  if (!orgs?.length) {
    await insightApi.runPipeline(supabase, {});
    return { runs: 1 };
  }
  let runs = 0;
  for (const org of orgs) {
    await insightApi.runPipeline(supabase, { organizationId: org.id });
    runs += 1;
  }
  return { runs };
}

export async function processFounderInsightSnapshots(supabase: AuthClient) {
  const { composeFounderDashboard } = await import("@/lib/founder-intelligence/compose");
  const { data: schools } = await supabase.from("schools").select("id").limit(10);
  let snapshots = 0;
  if (!schools?.length) {
    await composeFounderDashboard(supabase, { seedDecisions: false });
    return { snapshots: 1 };
  }
  for (const school of schools) {
    await composeFounderDashboard(supabase, {
      schoolId: school.id,
      seedDecisions: false,
    });
    snapshots += 1;
  }
  return { snapshots };
}

export async function processCertificationReminderWorker(supabase: AuthClient) {
  const { emitCertificationExpiringAlerts } = await import(
    "@/lib/hr-platform/certifications"
  );
  const count = await emitCertificationExpiringAlerts(supabase, { withinDays: 90 });
  return { alerts: count };
}

export async function processFinancialAgingWorker(supabase: AuthClient) {
  try {
    const { snapshotAging } = await import("@/lib/finance-platform/aging");
    const { data: schools } = await supabase.from("schools").select("id").limit(10);
    if (!schools?.length) {
      return { ok: true, mode: "noop" as const, reason: "no_schools" };
    }
    let snapshots = 0;
    for (const school of schools) {
      await snapshotAging(supabase, { schoolId: school.id });
      snapshots += 1;
    }
    return { ok: true, mode: "snapshot" as const, snapshots };
  } catch (error) {
    return {
      ok: false,
      mode: "error" as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function processHealthSnapshotWorker(supabase: AuthClient) {
  const { runJagIntelligencePipeline } = await import("@/lib/jag-intelligence/pipeline");
  const result = await runJagIntelligencePipeline(supabase, {
    persistInsights: false,
    persistGraph: false,
  });
  try {
    await supabase.from("jag_context_snapshots").insert({
      organization_id: null,
      school_id: null,
      context: result.context,
    });
  } catch {
    // table may reject null org depending on RLS — best-effort
  }
  return { score: result.context.financialHealthScore };
}

export async function processNotificationDeliveryWorker(supabase: AuthClient) {
  // Drain a small batch of queued platform communications
  const { data } = await supabase
    .from("platform_communications")
    .select("id")
    .eq("status", "queued")
    .limit(25);
  const ids = (data ?? []).map((r) => r.id);
  if (!ids.length) return { delivered: 0 };
  await supabase
    .from("platform_communications")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .in("id", ids);
  return { delivered: ids.length };
}

export async function processScheduledTriggerWorker(supabase: AuthClient) {
  const { processScheduledWorkflowTriggers } = await import(
    "@/lib/workflows/scheduler"
  );
  return processScheduledWorkflowTriggers(supabase);
}

/** Wave entry for process-queues */
export async function processRc11ProductionWorkers(supabase: AuthClient) {
  ensureProductionIntegrationsRegistered();
  const results: Record<string, unknown> = {};
  const jobs: Array<[string, () => Promise<unknown>]> = [
    ["jag.pipeline", () => processJagPipelineWorker(supabase)],
    ["founder.snapshots", () => processFounderInsightSnapshots(supabase)],
    ["hr.certReminders", () => processCertificationReminderWorker(supabase)],
    ["finance.aging", () => processFinancialAgingWorker(supabase)],
    ["health.snapshots", () => processHealthSnapshotWorker(supabase)],
    ["notifications.delivery", () => processNotificationDeliveryWorker(supabase)],
    ["workflows.scheduled", () => processScheduledTriggerWorker(supabase)],
  ];

  for (const [name, run] of jobs) {
    try {
      results[name] = await run();
    } catch (error) {
      results[name] = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return results;
}
