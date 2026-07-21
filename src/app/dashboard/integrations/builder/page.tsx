import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getCustomConnectors } from "@/lib/integration-hub/connector-builder";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable } from "@/components/integration-hub/IntHubPanels";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { createCustomConnectorAction } from "@/lib/integration-hub/actions";
import { CUSTOM_CONNECTOR_PROTOCOLS, CONNECTOR_AUTH_TYPES } from "@/lib/integration-hub/types";

export default async function ConnectorBuilderPage() {
  await requirePagePermission(["integration.view", "integration.manage", "integration.admin"]);
  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const custom = orgId ? await getCustomConnectors(supabase, orgId) : [];

  return (
    <IntHubShell title="Low-Code Connector Builder" subtitle="Build connectors without programming — REST, SOAP, GraphQL, Webhook, CSV, XML, JSON, FTP, SFTP, SQL, OData">
      <div className="rounded-xl border bg-slate-50 p-4 text-sm">
        <p className="font-medium">Wizard steps</p>
        <ol className="mt-2 list-decimal pl-5 text-slate-600">
          <li>Authentication — {CONNECTOR_AUTH_TYPES.join(", ")}</li>
          <li>Mapping — field transforms and schedules</li>
          <li>Testing — sandbox validation</li>
          <li>Publishing — activate connector</li>
          <li>Monitoring — health and execution metrics</li>
        </ol>
      </div>
      <ExperienceForm
        action={createCustomConnectorAction}
        verb="build"
        labels={{ idle: "Start wizard", loading: "Building…", success: "✓ Started" }}
        progressLabel="Starting connector builder…"
        successToast="✓ Connector draft started."
        errorToast="Unable to start builder."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
      >
        <input name="connector_name" placeholder="Connector name" className="rounded-lg border px-3 py-2 text-sm" required />
        <select name="protocol" className="rounded-lg border px-3 py-2 text-sm">
          {CUSTOM_CONNECTOR_PROTOCOLS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>
      </ExperienceForm>
      <IntHubTable rows={custom} columns={[
        { key: "connector_name", label: "Connector" }, { key: "protocol", label: "Protocol" },
        { key: "status", label: "Status" }, { key: "created_at", label: "Created" },
      ]} />
    </IntHubShell>
  );
}
