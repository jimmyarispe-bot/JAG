import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import { WorkflowLifecycleActions } from "@/components/workflows/WorkflowLifecycleActions";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditWorkflows,
  canViewWorkflows,
  getWorkflowById,
} from "@/lib/workflows";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewWorkflows(identity)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const workflow = await getWorkflowById(id);
  if (!workflow) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title={workflow.name}
        subtitle={`${workflow.trigger_key} · v${workflow.version} · ${workflow.enabled ? "enabled" : "disabled"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canEditWorkflows(identity) ? (
              <WorkflowLifecycleActions
                workflowId={workflow.id}
                enabled={workflow.enabled}
                status={workflow.status}
                variant="header"
              />
            ) : (
              <Link
                href="/dashboard/workflows/history"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                History
              </Link>
            )}
            <Link
              href="/dashboard/workflows"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        }
      />
      <WorkflowBuilder workflow={workflow} canEdit={canEditWorkflows(identity)} />
    </div>
  );
}
