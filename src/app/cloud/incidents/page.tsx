import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getIncidents } from "@/lib/cloud-platform/incidents";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { createIncidentAction, resolveIncidentAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { IntHubIdButton } from "@/components/integration-hub/IntHubMutationControls";

export default async function CloudIncidentsPage() {
  await requireCloudPermission(["cloud.admin", "cloud.operations"]);
  const supabase = await createAuthClient();
  const incidents = await getIncidents(supabase);

  return (
    <CloudShell title="Incident Management" subtitle="Outages, performance issues, root cause, and post-incident reviews">
      <ExperienceForm
          action={createIncidentAction}
          verb="create"
          labels={{ idle: "Open incident" }}
          progressLabel="Open incident…"
          className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <input name="title" placeholder="Incident title" className="flex-1 rounded-lg border px-3 py-2 text-sm" required />
          <select name="severity" className="rounded-lg border px-3 py-2 text-sm">
          <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option>
          </select>
        </ExperienceForm>
      <CloudTable rows={incidents} columns={[
        { key: "incident_number", label: "#" }, { key: "title", label: "Title" },
        { key: "severity", label: "Severity" }, { key: "status", label: "Status" },
      ]} />
      {incidents.filter((i) => i.status !== "resolved").map((i) => (
        <span key={i.id} className="mr-2 inline-block">
          <IntHubIdButton
            action={resolveIncidentAction}
            idField="incident_id"
            idValue={i.id}
            verb="save"
            labels={{ idle: "Resolve", loading: "Resolving…", success: "✓ Resolved" }}
            progressLabel="Resolving incident…"
            successToast="✓ Incident resolved."
            errorToast="Unable to resolve incident."
            variant="warning"
            size="sm"
          />
        </span>
      ))}
    </CloudShell>
  );
}
