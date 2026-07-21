import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getSubscriptions, getSubscriptionPlans, getMrr } from "@/lib/cloud-platform/subscriptions";
import { getCustomers } from "@/lib/cloud-platform/customers";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { createSubscriptionAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function CloudSubscriptionsPage() {
  await requireCloudPermission(["cloud.admin", "cloud.sales", "cloud.finance"]);
  const supabase = await createAuthClient();
  const [subs, plans, customers, mrr] = await Promise.all([
    getSubscriptions(supabase), getSubscriptionPlans(supabase), getCustomers(supabase), getMrr(supabase),
  ]);

  return (
    <CloudShell title="Subscription Engine" subtitle="Free trial, Starter, Professional, Enterprise, and custom plans">
      <p className="text-lg font-semibold">MRR: ${mrr.toFixed(2)}</p>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <ExperienceForm
          action={createSubscriptionAction}
          verb="create"
          labels={{ idle: "Create" }}
          progressLabel="Create…"
          className="flex flex-wrap gap-3"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <select name="customer_id" className="rounded-lg border px-3 py-2 text-sm">
          {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
          <select name="plan_key" className="rounded-lg border px-3 py-2 text-sm">
          {plans.map((p) => <option key={p.plan_key} value={p.plan_key}>{p.display_name}</option>)}
          </select>
        </ExperienceForm>
      </section>
      <CloudTable rows={subs} columns={[
        { key: "plan_key", label: "Plan" }, { key: "status", label: "Status" },
        { key: "billing_cycle", label: "Billing" }, { key: "monthly_amount_usd", label: "Amount" },
      ]} />
    </CloudShell>
  );
}
