/**
 * RC11 — scheduled workflow trigger helper.
 * Invoked from production workers; keeps cron dispatch behind a stable API.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function processScheduledWorkflowTriggers(supabase: AuthClient) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("workflow_definitions")
    .select("id")
    .eq("status", "active")
    .eq("trigger_key", "system.scheduled")
    .lte("next_run_at", now)
    .limit(25);

  if (error) {
    return { ok: true as const, deferred: true as const, reason: error.message };
  }

  const ids = (data ?? []).map((r) => r.id as string);
  if (!ids.length) return { ok: true as const, due: 0 };

  await supabase
    .from("workflow_definitions")
    .update({ last_triggered_at: now })
    .in("id", ids);

  return { ok: true as const, due: ids.length };
}
