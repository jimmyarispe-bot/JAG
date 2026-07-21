import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkflowDashboard } from "@/components/workflows/WorkflowDashboard";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditWorkflows,
  canViewWorkflows,
  listWorkflows,
} from "@/lib/workflows";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function WorkflowsPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewWorkflows(identity)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = sp.status ?? "all";

  const result = await listWorkflows({
    search: sp.search ?? "",
    status: status as "all" | "enabled" | "disabled" | "archived",
    page,
    pageSize: 25,
    sort: (sp.sort as "name" | "updated_at" | "last_run_at" | "success_rate") ?? "updated_at",
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Workflows"
        subtitle="Event-driven automation across AcademyOS"
        actions={
          <Link
            href="/dashboard/workflows/history"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Execution history
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-slate-500">Loading workflows…</p>}>
        <WorkflowDashboard
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          search={sp.search ?? ""}
          statusFilter={status}
          canEdit={canEditWorkflows(identity)}
        />
      </Suspense>
    </div>
  );
}
