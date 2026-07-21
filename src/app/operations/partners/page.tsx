import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireOperationsPermission } from "@/lib/operations-platform/page-guard";
import { getPartners } from "@/lib/operations-platform/partners";
import { OpsShell } from "@/components/operations-platform/OpsNav";
import { OpsTable } from "@/components/operations-platform/OpsPanels";
import { createPartnerAction } from "@/lib/operations-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function OperationsPartnersPage() {
  await requireOperationsPermission(["operations.partners"]);
  const supabase = await createAuthClient();
  const partners = await getPartners(supabase);

  return (
    <OpsShell title="Partner Platform" subtitle="Implementation, technology, marketplace developers, state consultants, training providers — certification and revenue">
      <ExperienceForm
          action={createPartnerAction}
          verb="create"
          labels={{ idle: "Add partner" }}
          progressLabel="Add partner…"
          className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <input name="partner_name" placeholder="Partner name" className="rounded-lg border px-3 py-2 text-sm" required />
          <select name="partner_type" className="rounded-lg border px-3 py-2 text-sm">
          <option value="implementation">Implementation</option>
          <option value="technology">Technology</option>
          <option value="marketplace_developer">Marketplace Developer</option>
          <option value="state_consultant">State Consultant</option>
          <option value="training_provider">Training Provider</option>
          </select>
        </ExperienceForm>
      <OpsTable rows={partners} columns={[
        { key: "partner_name", label: "Partner" }, { key: "partner_type", label: "Type" },
        { key: "certification_status", label: "Certified" }, { key: "performance_score", label: "Performance" },
        { key: "revenue_share_pct", label: "Rev Share %" }, { key: "total_revenue", label: "Revenue" },
      ]} />
    </OpsShell>
  );
}
