import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canEditWorkflows } from "@/lib/workflows";
import { createWorkflowAction } from "@/lib/workflows/server-actions";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";
import { STARTER_WORKFLOW_TEMPLATES } from "@/lib/workflows/templates";
import { installTemplateAction } from "@/lib/workflows/server-actions";

export default async function NewWorkflowPage() {
  const identity = await getIdentityContext();
  if (!canEditWorkflows(identity)) {
    redirect("/dashboard/workflows");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="New workflow"
        subtitle="Create from scratch or install a starter template"
        actions={
          <Link
            href="/dashboard/workflows"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        }
      />

      <form
        action={async (formData) => {
          "use server";
          const result = await createWorkflowAction(formData);
          if ("error" in result && result.error) {
            redirect(`/dashboard/workflows/new?error=${encodeURIComponent(result.error)}`);
          }
          if ("workflowId" in result) {
            redirect(`/dashboard/workflows/${result.workflowId}`);
          }
        }}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold">Create workflow</h2>
        <input
          name="name"
          required
          placeholder="Workflow name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          placeholder="Description"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue="general"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {["admissions","students","families","communications","scholarships","billing","attendance","hr","system","general"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          name="trigger_key"
          defaultValue="system.manual"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {WORKFLOW_TRIGGER_LIBRARY.map((t) => (
            <option key={t.key} value={t.key}>
              {t.category} — {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Create & open builder
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Starter templates</h2>
        <ul className="mt-3 space-y-2">
          {STARTER_WORKFLOW_TEMPLATES.map((t) => (
            <li
              key={t.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.description}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  const result = await installTemplateAction(t.key);
                  if ("workflowId" in result) {
                    redirect(`/dashboard/workflows/${result.workflowId}`);
                  }
                  redirect("/dashboard/workflows");
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Install
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
