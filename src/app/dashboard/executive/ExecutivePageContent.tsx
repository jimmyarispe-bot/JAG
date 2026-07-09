import Link from "next/link";
import {
  ExecutiveExperienceShell,
  ExecutionPipeline,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  MetricCard,
  QuickActions,
  type XesNavItem,
} from "@/components/experience-system";
import { CommandCenterDashboard } from "@/components/executive/CommandCenterDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCount } from "@/lib/format";
import { getExecutiveDeadlineAnalytics } from "@/lib/compliance/deadlines";
import { getExecutiveFinancialDashboard } from "@/lib/financial-intelligence/executive";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  EXECUTIVE_WORK_PERSPECTIVES,
  resolveJagWorkPerspective,
} from "@/lib/platform/jag-work";
import {
  loadExecutiveIntelligenceWorkspace,
} from "@/lib/platform/executive-intelligence";
import { decisionsToLegacyJagWork } from "@/lib/dashboard/morning-brief/sections";
import { createAuthClient } from "@/lib/supabase/server-auth";
import "@/lib/platform/execution-engine";

interface ExecutivePageContentProps {
  searchParams: Promise<{ view?: string; work?: string }>;
}

async function ExecutiveOperationalLoopView() {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id || ctx?.accessibleSchoolIds[0];

  const supabase = await createAuthClient();
  const { getOperationalLoopSummary } = await import("@/lib/platform/operational-loop/queries");
  const { generateSchoolLoopGapReport } = await import("@/lib/platform/operational-loop/diagnostics");

  const [summary, gapReports] = await Promise.all([
    getOperationalLoopSummary(supabase, schoolId),
    schoolId ? generateSchoolLoopGapReport(supabase, schoolId, 30) : Promise.resolve([]),
  ]);

  const { OperationalLoopDashboard } = await import("@/components/executive/OperationalLoopDashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Loop"
        subtitle="Canonical JAG lifecycle — transition audit, gaps, and recovery"
        actions={
          <Link
            href="/dashboard/executive?work=today"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            ← Executive work queue
          </Link>
        }
      />
      <OperationalLoopDashboard summary={summary} gapReports={gapReports} />
    </div>
  );
}

async function ExecutiveLegacyCommandCenter() {
  const ctx = await getIdentityContext();
  if (!ctx) return null;
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id || ctx.accessibleSchoolIds[0];

  const supabase = await createAuthClient();

  // Sprint 002: shared workspace — no generateExecutiveInsights / CCM on page load.
  const workspace = await loadExecutiveIntelligenceWorkspace(supabase, ctx, {
    schoolId,
    includeJagWork: false,
  });

  const [deadlineAnalytics, fiDashboard] = await Promise.all([
    getExecutiveDeadlineAnalytics(supabase, schoolId),
    schoolId ? getExecutiveFinancialDashboard(supabase, schoolId) : null,
  ]);

  const insights = workspace.alerts.alerts.slice(0, 12).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.description,
    severity: a.severity.toLowerCase(),
    insight_type: a.category.toLowerCase(),
    recommended_action: a.recommendedAction,
    href: a.missionControlReference
      ? "/dashboard/mission-control"
      : "/dashboard/executive",
    metric_key: a.signalKey,
    metric_value: null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Command Center"
        subtitle="Cross-module metrics and intelligence"
        actions={
          <Link
            href="/dashboard/executive?work=today"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            ← Work queue
          </Link>
        }
      />
      <CommandCenterDashboard
        metrics={workspace.commandCenterMetrics}
        insights={insights}
        deadlineAnalytics={deadlineAnalytics}
        fiDashboard={fiDashboard}
      />
    </div>
  );
}

export async function ExecutivePageContent({ searchParams }: ExecutivePageContentProps) {
  const sp = await searchParams;
  if (sp.view === "operational-loop") {
    return <ExecutiveOperationalLoopView />;
  }
  if (sp.view === "command-center") {
    return <ExecutiveLegacyCommandCenter />;
  }

  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id || ctx.accessibleSchoolIds[0];
  const workPerspective = resolveJagWorkPerspective("executive", sp.work);
  const execution = await executeWorkspace({
    workspaceKey: "executive",
    identity: ctx,
    activeView: workPerspective,
    recommendationFacts: { has_permission: ctx.permissions.length > 0 },
  });
  const workspaceState = execution.state;
  const supabase = await createAuthClient();

  // Sprint 002: one workspace load — aggregate, alerts, decisions, JAG Work.
  // No generateExecutiveInsights / getCommandCenterMetrics / getExecutiveInsights.
  const intelligence = await loadExecutiveIntelligenceWorkspace(supabase, ctx, {
    schoolId,
    jagWorkPerspective: workPerspective,
    engineRecommendations: workspaceState?.recommendations ?? [],
    executionState: workspaceState,
  });

  // Merge decision-queue items into JAG Work perspectives (no second queue store).
  // Workspace already resolved JAG Work once — do not call resolveJagWorkQueue again.
  const decisionItems = decisionsToLegacyJagWork(
    intelligence.decisions.decisions.slice(0, 20)
  );
  const workQueue = intelligence.jagWork;
  const mergedAll = [...workQueue.allItems];
  const seen = new Set(mergedAll.map((i) => i.id));
  for (const item of decisionItems) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    mergedAll.push(item);
  }

  const perspectives = { ...workQueue.perspectives };
  for (const key of ["needs_human_decision", "strategic_decisions"] as const) {
    const fromDecisions = decisionItems.filter((i) =>
      i.perspectives.includes(key)
    );
    if (fromDecisions.length) {
      const existing = perspectives[key] ?? [];
      const ids = new Set(fromDecisions.map((i) => i.id));
      perspectives[key] = [
        ...fromDecisions,
        ...existing.filter((i) => !ids.has(i.id)),
      ];
    }
  }

  const mergedQueue = {
    ...workQueue,
    activePerspective: workPerspective,
    perspectives,
    allItems: mergedAll,
    counts: {
      ...workQueue.counts,
      needs_human_decision:
        perspectives.needs_human_decision?.length ??
        workQueue.counts.needs_human_decision ??
        0,
      strategic_decisions:
        perspectives.strategic_decisions?.length ??
        workQueue.counts.strategic_decisions ??
        0,
      board_ready: workQueue.counts.board_ready ?? 0,
    } as Record<string, number>,
  };

  const navItems: XesNavItem[] = (workspaceState?.navigation ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    active: item.id === workPerspective,
    badge: mergedQueue.counts[item.id] || undefined,
  }));

  const orgContext = workspaceState?.org ?? null;
  const perspectiveLabel =
    EXECUTIVE_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ??
    "Today's Work";
  const activeItems = mergedQueue.perspectives[workPerspective] ?? [];
  const metrics = intelligence.commandCenterMetrics;

  return (
    <ExecutiveExperienceShell
      breadcrumbs={[
        { label: "Executive Intelligence", href: "/dashboard/executive?work=today" },
        { label: perspectiveLabel },
      ]}
      navItems={navItems}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      subtitle={orgContext?.activeScope.organizationName ?? "Strategic oversight"}
      insightPanel={
        <div className="space-y-4">
          {orgContext && <JagOrganizationContextPanel org={orgContext} />}
          <ExecutionPipeline title="Work resolution" currentStepId="execute" compact />
          <QuickActions
            title="Executive shortcuts"
            actions={[
              {
                id: "command",
                label: "Command center",
                href: "/dashboard/executive?view=command-center",
                variant: "secondary",
              },
              {
                id: "loop",
                label: "Operational loop",
                href: "/dashboard/executive?view=operational-loop",
                variant: "secondary",
              },
              {
                id: "decisions",
                label: "Decisions",
                href: "/dashboard/executive/decisions",
                variant: "primary",
              },
              {
                id: "board",
                label: "Board ready",
                href: "/dashboard/executive?work=board_ready",
                variant: "secondary",
              },
            ]}
          />
        </div>
      }
    >
      {orgContext && <JagOrganizationContextBar org={orgContext} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Work in queue"
          value={formatCount(activeItems.length)}
          description={perspectiveLabel}
          accent="brand"
          icon={<span className="text-lg font-bold">W</span>}
        />
        <MetricCard
          title="Compliance alerts"
          value={formatCount(metrics.complianceAlerts)}
          description="Overdue obligations"
          accent="amber"
          icon={<span className="text-lg font-bold">!</span>}
        />
        <MetricCard
          title="Strategic decisions"
          value={formatCount(mergedQueue.counts.strategic_decisions ?? 0)}
          description="Pending judgment"
          accent="indigo"
          icon={<span className="text-lg font-bold">S</span>}
        />
        <MetricCard
          title="Board ready"
          value={formatCount(mergedQueue.counts.board_ready ?? 0)}
          description="Reporting items"
          accent="emerald"
          icon={<span className="text-lg font-bold">B</span>}
        />
      </div>
      <JagWorkPanel queue={mergedQueue} perspective={workPerspective} />
    </ExecutiveExperienceShell>
  );
}

export function ExecutivePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );
}
