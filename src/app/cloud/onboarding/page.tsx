import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getOnboardingSessions } from "@/lib/cloud-platform/customer-success";
import { getCustomers } from "@/lib/cloud-platform/customers";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { startOnboardingAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function CloudOnboardingPage() {
  await requireCloudPermission(["cloud.admin", "cloud.support", "cloud.sales"]);
  const supabase = await createAuthClient();
  const [sessions, customers] = await Promise.all([getOnboardingSessions(supabase), getCustomers(supabase)]);

  return (
    <CloudShell title="Customer Onboarding" subtitle="Implementation checklist and go-live tracking">
      <ExperienceForm
          action={startOnboardingAction}
          verb="create"
          labels={{ idle: "Start onboarding" }}
          progressLabel="Start onboarding…"
          className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <select name="customer_id" className="rounded-lg border px-3 py-2 text-sm">
          {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
        </ExperienceForm>
      <CloudTable rows={sessions} columns={[
        { key: "current_step", label: "Step" }, { key: "status", label: "Status" }, { key: "created_at", label: "Started" },
      ]} />
    </CloudShell>
  );
}
