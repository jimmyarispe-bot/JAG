import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getWebhooks, getWebhookDeliveries, getSupportedWebhookEvents, getDeadLetterQueue } from "@/lib/integration-hub/webhook-engine";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable } from "@/components/integration-hub/IntHubPanels";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { createWebhookAction } from "@/lib/integration-hub/actions";

export default async function IntegrationWebhooksPage() {
  await requirePagePermission(["integration.view", "integration.manage", "integration.admin"]);
  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  if (!orgId) return null;
  const [webhooks, deliveries, deadLetter, events] = await Promise.all([
    getWebhooks(supabase, orgId),
    getWebhookDeliveries(supabase, orgId),
    getDeadLetterQueue(supabase, orgId),
    Promise.resolve(getSupportedWebhookEvents()),
  ]);

  return (
    <IntHubShell title="Webhook Engine" subtitle="Outgoing and incoming webhooks — signing secrets, retries, replay, queue, failure history, dead-letter queue">
      <ExperienceForm
        action={createWebhookAction}
        verb="create"
        labels={{ idle: "Create webhook", loading: "Creating…", success: "✓ Created" }}
        progressLabel="Creating webhook…"
        successToast="✓ Webhook created."
        errorToast="Unable to create webhook."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
      >
        <input name="webhook_name" placeholder="Webhook name" className="rounded-lg border px-3 py-2 text-sm" required />
        <input name="endpoint_url" placeholder="https://..." className="min-w-[240px] rounded-lg border px-3 py-2 text-sm" required />
      </ExperienceForm>
      <IntHubTable rows={webhooks} columns={[{ key: "webhook_name", label: "Name" }, { key: "direction", label: "Direction" }, { key: "is_active", label: "Active" }]} />
      <h2 className="font-semibold">Supported Events</h2>
      <ul className="grid gap-1 sm:grid-cols-2 text-sm">{events.map((e) => <li key={e.key} className="rounded bg-slate-50 px-3 py-1">{e.label}</li>)}</ul>
      <h2 className="font-semibold">Dead-Letter Queue ({deadLetter.length})</h2>
      <IntHubTable rows={deadLetter} columns={[{ key: "event_type", label: "Event" }, { key: "failure_reason", label: "Reason" }, { key: "replayable", label: "Replayable" }]} />
      {deliveries.length > 0 && (
        <>
          <h2 className="font-semibold">Recent Deliveries</h2>
          <IntHubTable rows={deliveries.slice(0, 20)} columns={[{ key: "event_type", label: "Event" }, { key: "status", label: "Status" }, { key: "attempted_at", label: "Attempted" }]} />
        </>
      )}
    </IntHubShell>
  );
}
