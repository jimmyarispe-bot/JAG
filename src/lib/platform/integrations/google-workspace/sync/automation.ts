/**
 * Background jobs for Google Workspace sync:
 * Run Now (API), hourly incremental, daily full, retry failed.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { runGoogleWorkspaceSync } from "@/lib/platform/integrations/google-workspace/sync/engine";
import { listDueGoogleWorkspaceSyncs } from "@/lib/platform/integrations/google-workspace/sync/registry-store";
import type { GoogleSyncResult } from "@/lib/platform/integrations/google-workspace/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function processGoogleWorkspaceSyncJobs(
  supabase: AuthClient
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: GoogleSyncResult[];
}> {
  const due = await listDueGoogleWorkspaceSyncs(supabase);
  const results: GoogleSyncResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of due) {
    const mode =
      item.registry.consecutiveFailures > 0 && item.mode === "incremental"
        ? ("retry" as const)
        : item.mode;
    const result = await runGoogleWorkspaceSync(supabase, {
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
