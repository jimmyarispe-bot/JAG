import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExecutionHistory } from "@/components/workflows/ExecutionHistory";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditWorkflows,
  canViewWorkflows,
  listExecutions,
  listWorkflows,
} from "@/lib/workflows";
import type { ExecutionStatus } from "@/lib/workflows/types";

interface PageProps {
  searchParams: Promise<{
    workflowId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function WorkflowHistoryPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewWorkflows(identity)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = (sp.status ?? "all") as ExecutionStatus | "all";

  const [executions, workflows] = await Promise.all([
    listExecutions({
      workflowId: sp.workflowId,
      status,
      fromDate: sp.from ? `${sp.from}T00:00:00.000Z` : undefined,
      toDate: sp.to ? `${sp.to}T23:59:59.999Z` : undefined,
      page,
      pageSize: 25,
    }),
    listWorkflows({ status: "all", pageSize: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Execution history"
        subtitle="Workflow runs, failures, retries, and dead-letter queue"
        actions={
          <Link
            href="/dashboard/workflows"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to workflows
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-slate-500">Loading history…</p>}>
        <ExecutionHistory
          rows={executions.rows as Array<{
            id: string;
            workflow_id: string;
            workflowName?: string;
            trigger_key: string;
            status: string;
            started_at: string | null;
            finished_at: string | null;
            duration_ms: number | null;
            error_message: string | null;
            created_at: string;
            attempt: number;
          }>}
          total={executions.total}
          page={executions.page}
          pageSize={executions.pageSize}
          statusFilter={sp.status ?? "all"}
          workflowId={sp.workflowId}
          canEdit={canEditWorkflows(identity)}
          workflows={workflows.rows.map((w) => ({ id: w.id, name: w.name }))}
        />
      </Suspense>
    </div>
  );
}
