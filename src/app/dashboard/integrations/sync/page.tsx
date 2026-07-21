import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getSyncHistory, getSyncSchedules, getSyncConflicts } from "@/lib/integration-hub/sync-engine";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable } from "@/components/integration-hub/IntHubPanels";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { queueSyncAction } from "@/lib/integration-hub/actions";

export default async function IntegrationSyncPage() {
  await requirePagePermission(["integration.view", "integration.manage", "integration.admin"]);
  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  if (!orgId) return null;
  const [history, schedules, conflicts] = await Promise.all([
    getSyncHistory(supabase, orgId),
    getSyncSchedules(supabase, orgId),
    getSyncConflicts(supabase, orgId),
  ]);

  return (
    <IntHubShell title="Synchronization Engine" subtitle="v1.0: OAuth/API connector sync is not available. Use file import via Data Platform or Financial Intelligence.">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Live connector sync is disabled for v1.0. Queued jobs will fail with a clear message. Use CSV or QuickBooks file import instead.
      </p>
      <ExperienceForm
        action={queueSyncAction}
        verb="sync"
        labels={{ idle: "Queue sync (unavailable v1.0)", loading: "Queuing…", success: "✓ Queued" }}
        progressLabel="Queuing sync job…"
        successToast="✓ Sync queued."
        errorToast="Unable to queue sync."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonVariant="secondary"
        buttonClassName="!border-slate-300 !text-slate-600"
      >
        <select name="sync_mode" className="rounded-lg border px-3 py-2 text-sm" aria-label="Sync mode">
          <option value="manual">Manual</option>
          <option value="scheduled">Scheduled</option>
          <option value="realtime">Real-time</option>
        </select>
      </ExperienceForm>
      <IntHubTable rows={history} columns={[
        { key: "sync_type", label: "Type" }, { key: "direction", label: "Direction" },
        { key: "status", label: "Status" }, { key: "records_processed", label: "Records" },
      ]} />
      <h2 className="font-semibold">Pending Conflicts ({conflicts.length})</h2>
      <IntHubTable rows={conflicts} columns={[{ key: "entity_type", label: "Entity" }, { key: "field_name", label: "Field" }, { key: "resolution", label: "Resolution" }]} />
      <h2 className="font-semibold">Schedules</h2>
      <IntHubTable rows={schedules} columns={[{ key: "schedule_name", label: "Name" }, { key: "sync_mode", label: "Mode" }, { key: "cron_expression", label: "Cron" }]} />
    </IntHubShell>
  );
}
