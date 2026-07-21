import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getProvisioningJobs } from "@/lib/integration-hub/tenant-provisioning";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable } from "@/components/integration-hub/IntHubPanels";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { provisionTenantAction } from "@/lib/integration-hub/actions";

export default async function ProvisioningPage() {
  await requirePagePermission(["integration.admin"]);
  const supabase = await createAuthClient();
  const jobs = await getProvisioningJobs(supabase);

  return (
    <IntHubShell title="Tenant Provisioning Engine" subtitle="One-click customer provisioning — organization, tenant, modules, subscription, storage, encryption, backup, monitoring">
      <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
        Automatically creates organization, tenant, configuration package, purchased modules, subscription, admin, storage, encryption keys, backup, monitoring, and optional demo data.
      </div>
      <ExperienceForm
        action={provisionTenantAction}
        verb="run"
        labels={{ idle: "Provision tenant", loading: "Provisioning…", success: "✓ Started" }}
        progressLabel="Provisioning tenant…"
        successToast="✓ Provisioning started."
        errorToast="Unable to provision tenant."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
      >
        <input name="tenant_name" placeholder="Tenant name" className="rounded-lg border px-3 py-2 text-sm" required />
        <select name="config_package" className="rounded-lg border px-3 py-2 text-sm">
          <option value="enterprise">Enterprise</option>
          <option value="standard">Standard</option>
          <option value="starter">Starter</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="include_demo_data" /> Generate demo data</label>
      </ExperienceForm>
      <IntHubTable rows={jobs} columns={[
        { key: "tenant_name", label: "Tenant" }, { key: "status", label: "Status" },
        { key: "config_package", label: "Package" }, { key: "include_demo_data", label: "Demo" },
        { key: "started_at", label: "Started" }, { key: "completed_at", label: "Completed" },
      ]} />
    </IntHubShell>
  );
}
