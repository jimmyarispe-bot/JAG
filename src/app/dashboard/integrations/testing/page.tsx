import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getEventCatalog } from "@/lib/integration-hub/event-bus";
import { getTestingScenarios } from "@/lib/integration-hub/testing-lab";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { ExperienceForm } from "@/components/integration-hub/IntHubMutationControls";
import { publishTestEventAction, runLabTestAction } from "@/lib/integration-hub/actions";

export default async function IntegrationTestingPage() {
  await requirePagePermission(["integration.manage", "integration.admin", "integration.developer", "developer.portal"]);
  const supabase = await createAuthClient();
  await getPrimaryOrganizationId(supabase);
  const catalog = getEventCatalog();
  const scenarios = getTestingScenarios();

  return (
    <IntHubShell title="Developer Testing Lab" subtitle="Test API calls, webhook delivery, connector health, authentication, sync, retry, load, and error handling">
      <ExperienceForm
        action={runLabTestAction}
        verb="run"
        labels={{ idle: "Run lab test", loading: "Running…", success: "✓ Complete" }}
        progressLabel="Running lab test…"
        successToast="✓ Lab test complete."
        errorToast="Unable to run test."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
      >
        <select name="scenario" className="rounded-lg border px-3 py-2 text-sm">
          {scenarios.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </ExperienceForm>
      <ExperienceForm
        action={publishTestEventAction}
        verb="publish"
        labels={{ idle: "Publish test event", loading: "Publishing…", success: "✓ Published" }}
        progressLabel="Publishing test event…"
        successToast="✓ Event published."
        errorToast="Unable to publish event."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonVariant="secondary"
        buttonClassName="!border-indigo-600 !text-indigo-600"
      >
        <select name="event_type" className="rounded-lg border px-3 py-2 text-sm">
          {catalog.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
      </ExperienceForm>
    </IntHubShell>
  );
}
