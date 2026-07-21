/**
 * Background jobs for Microsoft 365 sync:
 * Run Now (API), hourly incremental, daily full, retry failed.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { runMicrosoft365Sync } from "@/lib/platform/integrations/microsoft-365/sync/engine";
import { listDueMicrosoft365Syncs } from "@/lib/platform/integrations/microsoft-365/sync/registry-store";
import type { MicrosoftSyncResult } from "@/lib/platform/integrations/microsoft-365/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function processMicrosoft365SyncJobs(
  supabase: AuthClient
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: MicrosoftSyncResult[];
}> {
  const due = await listDueMicrosoft365Syncs(supabase);
  const results: MicrosoftSyncResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of due) {
    const mode =
      item.registry.consecutiveFailures > 0 && item.mode === "incremental"
        ? ("retry" as const)
        : item.mode;
    const result = await runMicrosoft365Sync(supabase, {
      organizationId: item.registry.organizationId,
      mode,
      triggeredBy: mode === "retry" ? "retry" : "scheduler",
      forceFull: item.mode === "full",
    });
    results.push(result);
    if (result.ok) succeeded += 1;
    else failed += 1;
  }

  return {
    processed: results.length,
    succeeded,
    failed,
    results,
  };
}
