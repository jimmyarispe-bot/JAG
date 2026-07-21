import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getTickets } from "@/lib/cloud-platform/support";
import { getCustomers } from "@/lib/cloud-platform/customers";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { createTicketAction, resolveTicketAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { IntHubIdButton } from "@/components/integration-hub/IntHubMutationControls";

export default async function CloudSupportPage() {
  await requireCloudPermission(["cloud.admin", "cloud.support"]);
  const supabase = await createAuthClient();
  const [tickets, customers] = await Promise.all([getTickets(supabase), getCustomers(supabase)]);

  return (
    <CloudShell title="Support Desk" subtitle="Tickets, bugs, feature requests, escalations, and internal notes">
      <ExperienceForm
          action={createTicketAction}
          verb="create"
          labels={{ idle: "Create ticket" }}
          progressLabel="Create ticket…"
          className="space-y-3 rounded-2xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <select name="customer_id" className="w-full rounded-lg border px-3 py-2 text-sm">
          {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
          <input name="subject" placeholder="Subject" className="w-full rounded-lg border px-3 py-2 text-sm" required />
          <textarea name="description" placeholder="Description" className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
        </ExperienceForm>
      <CloudTable rows={tickets} columns={[
        { key: "ticket_number", label: "#" }, { key: "subject", label: "Subject" },
        { key: "priority", label: "Priority" }, { key: "status", label: "Status" },
      ]} />
      {tickets.filter((t) => t.status !== "resolved").map((t) => (
        <span key={t.id} className="mr-2 inline-block">
          <IntHubIdButton
            action={resolveTicketAction}
            idField="ticket_id"
            idValue={t.id}
            verb="save"
            labels={{ idle: `Resolve ${t.ticket_number}`, loading: "Resolving…", success: "✓ Resolved" }}
            progressLabel="Resolving ticket…"
            successToast="✓ Ticket resolved."
            errorToast="Unable to resolve ticket."
            variant="warning"
            size="sm"
          />
        </span>
      ))}
    </CloudShell>
  );
}
