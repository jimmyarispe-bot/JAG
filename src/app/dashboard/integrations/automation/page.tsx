import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getWorkflows, getWorkflowTemplates, getWorkflowRuns, getWorkflowAnalytics, getWorkflowStepTypes } from "@/lib/integration-hub/automation-studio";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable, AiReadinessNote } from "@/components/integration-hub/IntHubPanels";
import { ExperienceForm, IntHubIdButton } from "@/components/integration-hub/IntHubMutationControls";
import { createWorkflowAction, publishWorkflowAction, runWorkflowAction } from "@/lib/integration-hub/actions";

export default async function AutomationStudioPage() {
  await requirePagePermission(["integration.view", "integration.manage", "integration.admin"]);
  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const [workflows, templates, runs, analytics, stepTypes] = await Promise.all([
    orgId ? getWorkflows(supabase, orgId) : [],
    orgId ? getWorkflowTemplates(supabase, orgId) : [],
    orgId ? getWorkflowRuns(supabase, orgId) : [],
    orgId ? getWorkflowAnalytics(supabase, orgId) : { totalRuns: 0, successRate: 100, failed: 0 },
    Promise.resolve(getWorkflowStepTypes()),
  ]);

  return (
    <IntHubShell title="Enterprise Automation Studio" subtitle="Visual drag-and-drop workflows — triggers, conditions, branches, loops, approvals, retries, parallel execution, version history">
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Total Runs</p><p className="text-2xl font-bold">{analytics.totalRuns}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Success Rate</p><p className="text-2xl font-bold">{analytics.successRate.toFixed(0)}%</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Failed Runs</p><p className="text-2xl font-bold">{analytics.failed}</p></div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6">
        <p className="text-sm font-semibold text-indigo-900">Workflow Designer</p>
        <p className="mt-1 text-sm text-indigo-700">Drag-and-drop canvas — supports {stepTypes.join(", ")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {stepTypes.slice(0, 8).map((s) => (
            <span key={s} className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">{s}</span>
          ))}
        </div>
      </div>

      <ExperienceForm
        action={createWorkflowAction}
        verb="create"
        labels={{ idle: "Create draft", loading: "Creating…", success: "✓ Created" }}
        progressLabel="Saving automation rule…"
        successToast="✓ Workflow draft created."
        errorToast="Unable to create workflow."
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
        buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
      >
        <input name="workflow_name" placeholder="Workflow name" className="rounded-lg border px-3 py-2 text-sm" required />
        <input name="workflow_key" placeholder="workflow_key" className="rounded-lg border px-3 py-2 text-sm" />
        <select name="trigger_type" className="rounded-lg border px-3 py-2 text-sm">
          <option value="event">Event trigger</option>
          <option value="schedule">Schedule</option>
          <option value="webhook">Webhook</option>
          <option value="manual">Manual</option>
        </select>
      </ExperienceForm>

      <section>
        <h2 className="mb-2 font-semibold">Workflows ({workflows.length})</h2>
        <IntHubTable rows={workflows} columns={[
          { key: "workflow_name", label: "Name" }, { key: "status", label: "Status" },
          { key: "trigger_type", label: "Trigger" }, { key: "version", label: "Version" }, { key: "updated_at", label: "Updated" },
        ]} />
        {workflows.map((wf) => (
          <div key={String(wf.id)} className="mt-2 flex gap-2">
            <IntHubIdButton
              action={publishWorkflowAction}
              idField="workflow_id"
              idValue={String(wf.id)}
              verb="publish"
              labels={{ idle: "Publish", loading: "Publishing…", success: "✓ Published" }}
              progressLabel="Publishing workflow…"
              successToast="✓ Workflow published."
              errorToast="Unable to publish."
              className="!rounded !bg-slate-100 !px-3 !py-1 !text-xs"
            />
            <IntHubIdButton
              action={runWorkflowAction}
              idField="workflow_id"
              idValue={String(wf.id)}
              verb="run"
              labels={{ idle: "Test run", loading: "Running…", success: "✓ Ran" }}
              progressLabel="Running workflow…"
              successToast="✓ Workflow run started."
              errorToast="Unable to run workflow."
              className="!rounded !bg-indigo-100 !px-3 !py-1 !text-xs !text-indigo-800"
            />
          </div>
        ))}
      </section>

      {templates.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Templates — e.g. tuition payment received → Finance, Family Portal, Executive Dashboard, Receipt, Notifications</h2>
          <IntHubTable rows={templates} columns={[{ key: "workflow_name", label: "Template" }, { key: "description", label: "Description" }, { key: "status", label: "Status" }]} />
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Recent Runs</h2>
        <IntHubTable rows={runs} columns={[{ key: "status", label: "Status" }, { key: "started_at", label: "Started" }, { key: "completed_at", label: "Completed" }]} />
      </section>
      <AiReadinessNote />
    </IntHubShell>
  );
}
