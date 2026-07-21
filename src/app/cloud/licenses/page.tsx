import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getLicenses } from "@/lib/cloud-platform/licensing";
import { getCustomers } from "@/lib/cloud-platform/customers";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { issueLicenseAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function CloudLicensesPage() {
  await requireCloudPermission(["cloud.admin", "cloud.sales"]);
  const supabase = await createAuthClient();
  const [licenses, customers] = await Promise.all([getLicenses(supabase), getCustomers(supabase)]);

  return (
    <CloudShell title="Licensing" subtitle="Module, student, staff, storage, and API limits">
      <ExperienceForm
          action={issueLicenseAction}
          verb="create"
          labels={{ idle: "Issue license" }}
          progressLabel="Issue license…"
          className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <select name="customer_id" className="rounded-lg border px-3 py-2 text-sm">
          {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
          <input type="hidden" name="modules" value='["admissions","sis","finance"]' />
        </ExperienceForm>
      <CloudTable rows={licenses} columns={[
        { key: "license_key", label: "Key" }, { key: "status", label: "Status" },
        { key: "student_limit", label: "Students" }, { key: "expires_at", label: "Expires" },
      ]} />
    </CloudShell>
  );
}
