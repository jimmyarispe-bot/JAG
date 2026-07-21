import {
  KpiTilesSkeleton,
  ListSkeleton,
  ProgressivePageShell,
  TableSkeleton,
  WidgetBoundary,
} from "@/components/experience-system";
import { StatCard } from "@/components/dashboard/StatCard";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { MyWorkPanel } from "@/components/work/WorkPanels";
import { ProjectsList, TasksList } from "@/components/work/WorkLists";
import { formatCount } from "@/lib/format";
import { canViewWork } from "@/lib/work/access";
import { getMyWorkSummary, getUserWorkload, getProjects, getTasks } from "@/lib/work/queries";
import { WORK_TABS } from "@/lib/work/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";
import { ActionChip, ActionChipGroup } from "@/components/experience-system/feedback/ActionChip";

interface WorkPageContentProps {
  searchParams: Promise<{ view?: string }>;
}

async function loadWorkScope() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewWork(ctx)) return null;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    undefined;

  return {
    ctx,
    schoolId,
    userId: ctx.effectiveUserId,
    supabase: await createAuthClient(),
  };
}

async function WorkKpiWidgets() {
  const scope = await loadWorkScope();
  if (!scope) throw new Error("Work metrics are unavailable.");

  const summary = await getMyWorkSummary(scope.supabase, scope.userId, scope.schoolId);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Today" value={formatCount(summary.tasksToday)} description="Tasks due today" accent="indigo" icon={<span className="font-bold">T</span>} />
      <StatCard title="Overdue" value={formatCount(summary.overdue)} description="Needs attention" accent="rose" icon={<span className="font-bold">!</span>} />
      <StatCard title="Approvals" value={formatCount(summary.waitingApprovals)} description="Waiting on you" accent="amber" icon={<span className="font-bold">A</span>} />
      <StatCard title="Projects" value={formatCount(summary.activeProjects)} description="Active assignments" accent="sky" icon={<span className="font-bold">P</span>} />
    </section>
  );
}

async function WorkMainPanel({ view }: { view: string }) {
  const scope = await loadWorkScope();
  if (!scope) throw new Error("This work view is unavailable.");

  const { supabase, userId, schoolId } = scope;

  // Independent parallel fetches — load only what the active view needs.
  if (view === "my-work") {
    const [summary, workload] = await Promise.all([
      getMyWorkSummary(supabase, userId, schoolId),
      getUserWorkload(supabase, userId, schoolId),
    ]);
    return <MyWorkPanel summary={summary} workload={workload} />;
  }

  if (view === "tasks") {
    const tasks = await getTasks(supabase, { assigneeUserId: userId, schoolId, limit: 100 });
    return <TasksList tasks={tasks} />;
  }

  if (view === "projects") {
    const projects = await getProjects(supabase, { schoolId, limit: 50 });
    return <ProjectsList projects={projects} />;
  }

  if (view === "approvals") {
    const tasks = await getTasks(supabase, { assigneeUserId: userId, schoolId, limit: 100 });
    const approvalTasks = tasks.filter((t) => t.status === "needs_review" || t.task_type === "approval");
    return <TasksList tasks={approvalTasks} />;
  }

  return (
    <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      Meeting tasks linked from playbooks and scheduling appear in your task list when assigned.
    </p>
  );
}

export async function WorkPageContent({ searchParams }: WorkPageContentProps) {
  // Auth gate outside widget boundaries (redirect must not be caught by error UI).
  const scope = await loadWorkScope();
  if (!scope) redirect("/dashboard");

  const { view: rawView } = await searchParams;
  const validViews = new Set(WORK_TABS.map((t) => t.value));
  const view =
    rawView && validViews.has(rawView as (typeof WORK_TABS)[number]["value"])
      ? rawView
      : "my-work";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="My Work"
          subtitle="Tasks, approvals, projects, and deadlines — your personalized work hub"
        />
        <div role="toolbar" aria-label="Work shortcuts">
          <ActionChipGroup>
            <ActionChip href="/dashboard/projects" size="sm">
              Projects
            </ActionChip>
            <ActionChip href="/dashboard/playbooks" size="sm">
              Playbooks
            </ActionChip>
            <ActionChip href="/dashboard/workload" size="sm">
              Workload
            </ActionChip>
            <ActionChip href="/dashboard/work/reports" size="sm">
              Reports
            </ActionChip>
          </ActionChipGroup>
        </div>
      </div>

      <WidgetBoundary
        label="Work KPIs"
        errorTitle="Unable to load work metrics"
        skeleton={<KpiTilesSkeleton count={4} label="Loading work metrics…" />}
      >
        <WorkKpiWidgets />
      </WidgetBoundary>

      <ViewTabs tabs={WORK_TABS.map(({ href, label, value }) => ({ href, label, value }))} activeView={view} />

      <WidgetBoundary
        label="Work panel"
        errorTitle="Unable to load this work view"
        skeleton={
          view === "projects" || view === "tasks" || view === "approvals" ? (
            <TableSkeleton rows={6} cols={4} />
          ) : (
            <ListSkeleton rows={6} />
          )
        }
      >
        <WorkMainPanel view={view} />
      </WidgetBoundary>
    </div>
  );
}

export function WorkPageSkeleton() {
  return (
    <ProgressivePageShell
      title="My Work"
      subtitle="Tasks, approvals, projects, and deadlines"
      breadcrumbs={[{ label: "My Work" }]}
      label="Loading work hub…"
      showDefaultBody={false}
    >
      <KpiTilesSkeleton count={4} />
      <ListSkeleton rows={6} />
    </ProgressivePageShell>
  );
}
