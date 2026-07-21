import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/enterprise-data/context";
import { getConnectorDefinitions, getConnectorInstances } from "@/lib/enterprise-data/connectors";
import { getSyncHistory } from "@/lib/enterprise-data/sync-engine";
import { EdpShell } from "@/components/enterprise-data/EdpNav";
import { ConnectorGrid, HistoryTable } from "@/components/enterprise-data/EdpPanels";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { createConnectorAction, runSyncAction } from "@/lib/enterprise-data/actions";

export default async function DataConnectorsPage() {
  await requirePagePermission(["data.manage", "data.admin"]);

  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const [definitions, instances, syncHistory] = orgId
    ? await Promise.all([
        getConnectorDefinitions(supabase),
        getConnectorInstances(supabase, orgId),
        getSyncHistory(supabase, orgId),
      ])
    : [[], [], []];

  return (
    <EdpShell title="Integration Center" subtitle="Connector library — QuickBooks, Google, Clever, PowerSchool, Canvas, and more">
      <ConnectorGrid connectors={definitions} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Add connector instance</h2>
        <ExperienceForm
          action={createConnectorAction}
          verb="create"
          labels={{ idle: "Add instance", loading: "Connecting…", success: "✓ Connected" }}
          progressLabel="Adding connector instance…"
          successToast="✓ Connector instance added."
          errorToast="Unable to add connector."
          className="flex flex-wrap items-end gap-4"
        >
          <label className="block text-sm">
            Connector
            <select name="connector_key" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2">
              {definitions.map((d) => (
                <option key={d.connector_key} value={d.connector_key}>{d.display_name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Instance name
            <input name="instance_name" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2" defaultValue="Primary" />
          </label>
        </ExperienceForm>
      </section>

      {instances.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Run sync</h2>
          <ExperienceForm
            action={runSyncAction}
            verb="sync"
            labels={{ idle: "Manual sync", loading: "Syncing…", success: "✓ Synced" }}
            progressLabel="Running connector sync…"
            successToast="✓ Sync complete."
            errorToast="Unable to sync."
            className="flex flex-wrap items-end gap-4"
          >
            <label className="block text-sm">
              Instance
              <select name="connector_instance_id" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2">
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>{i.instance_name} ({i.connector_key})</option>
                ))}
              </select>
            </label>
          </ExperienceForm>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Sync history</h2>
        <HistoryTable
          rows={syncHistory}
          columns={[
            { key: "sync_type", label: "Type" },
            { key: "direction", label: "Direction" },
            { key: "status", label: "Status" },
            { key: "records_processed", label: "Records" },
          ]}
        />
      </section>
    </EdpShell>
  );
}
