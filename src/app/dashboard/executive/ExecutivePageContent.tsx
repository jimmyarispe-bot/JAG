import { cache } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ExecutiveExperienceShell,
  ExecutiveWidgetSkeleton,
  ExecutionPipeline,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  KpiTilesSkeleton,
  ListSkeleton,
  MetricCard,
  ProgressivePageShell,
  QuickActions,
  WidgetBoundary,
  progressiveShellProps,
  type XesNavItem,
} from "@/components/experience-system";
import { CommandCenterDashboard } from "@/components/executive/CommandCenterDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCount } from "@/lib/format";
import { getExecutiveDeadlineAnalytics } from "@/lib/compliance/deadlines";
import { getExecutiveFinancialDashboard } from "@/lib/financial-intelligence/executive";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getRequestWorkspaceContext } from "@/lib/platform/identity/request-context";
import {
  EXECUTIVE_WORK_PERSPECTIVES,
  resolveJagWorkPerspective,
} from "@/lib/platform/jag-work";
import { loadExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";
import {
  COMMAND_CENTER_ROLES,
  type CommandCenterRole,
} from "@/lib/platform/intelligence/executive-command-center/types";
import { decisionsToLegacyJagWork } from "@/lib/dashboard/morning-brief/sections";
import { createAuthClient } from "@/lib/supabase/server-auth";
import "@/lib/platform/execution-engine";

const InteractiveCommandCenter = dynamic(
  () =>
    import("@/components/executive-command-center").then((m) => ({
      default: m.InteractiveCommandCenter,
    })),
  {
    loading: () => (
      <div className="space-y-6">
        <KpiTilesSkeleton count={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ExecutiveWidgetSkeleton variant="insights" />
          <ExecutiveWidgetSkeleton variant="scorecard" />
        </div>
      </div>
    ),
  }
);

function resolveCommandCenterRole(raw: string | undefined): CommandCenterRole {
  if (raw && (COMMAND_CENTER_ROLES as readonly string[]).includes(raw)) {
    return raw as CommandCenterRole;
  }
  return "ceo";
}

interface ExecutivePageContentProps {
  searchParams: Promise<{ view?: string; work?: string; role?: string }>;
}

/** Shared workspace bundle — cached so parallel widgets do not refetch. */
const loadExecutiveWorkBundle = cache(async (work: string | undefined) => {
  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id || ctx.accessibleSchoolIds[0];
  const workPerspective = resolveJagWorkPerspective("executive", work);
  // P004: overlap engine with auth client (intelligence needs engine recommendations).
  const [execution, supabase] = await Promise.all([
    executeWorkspace({
      workspaceKey: "executive",
      identity: ctx,
      activeView: workPerspective,
      recommendationFacts: { has_permission: ctx.permissions.length > 0 },
    }),
    createAuthClient(),
  ]);
  const workspaceState = execution.state;

  // Sprint 002: one workspace load — aggregate, alerts, decisions, JAG Work.
  const intelligence = await loadExecutiveIntelligenceWorkspace(supabase, ctx, {
    schoolId,
    jagWorkPerspective: workPerspective,
    engineRecommendations: workspaceState?.recommendations ?? [],
    executionState: workspaceState,
  });

  const decisionItems = decisionsToLegacyJagWork(intelligence.decisions.decisions.slice(0, 20));
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
    const fromDecisions = decisionItems.filter((i) => i.perspectives.includes(key));
    if (fromDecisions.length) {
      const existing = perspectives[key] ?? [];
      const ids = new Set(fromDecisions.map((i) => i.id));
      perspectives[key] = [...fromDecisions, ...existing.filter((i) => !ids.has(i.id))];
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
        perspectives.needs_human_decision?.length ?? workQueue.counts.needs_human_decision ?? 0,
      strategic_decisions:
        perspectives.strategic_decisions?.length ?? workQueue.counts.strategic_decisions ?? 0,
      board_ready: workQueue.counts.board_ready ?? 0,
    } as Record<string, number>,
  };

  return {
    ctx,
    schoolId,
    workPerspective,
    workspaceState,
    intelligence,
    mergedQueue,
    orgContext: workspaceState?.org ?? null,
    perspectiveLabel:
      EXECUTIVE_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work",
  };
});

const loadCommandCenterBundle = cache(async () => {
  const ctx = await getIdentityContext();
  if (!ctx) return null;
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id || ctx.accessibleSchoolIds[0];
  const supabase = await createAuthClient();

  // P004: workspace + command-center extras are independent.
  const [workspace, deadlineAnalytics, fiDashboard] = await Promise.all([
    loadExecutiveIntelligenceWorkspace(supabase, ctx, {
      schoolId,
      includeJagWork: false,
    }),
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
    href: a.missionControlReference ? "/dashboard/mission-control" : "/dashboard/executive",
    metric_key: a.signalKey,
    metric_value: null,
  }));

  return { workspace, insights, deadlineAnalytics, fiDashboard };
});

const loadIntelligenceCommandCenter = cache(async (role: CommandCenterRole) => {
  const requestCtx = await getRequestWorkspaceContext();
  if (!requestCtx) return null;

  const { identity: ctx, organizationId } = requestCtx;
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    null;

  // RC-6.05 — build ECC directly (soft-reads inside engine). Do not run the
  // full ~50-module intelligence platform just to project one workspace.
  const { createExecutiveCommandCenter } = await import(
    "@/lib/platform/intelligence/executive-command-center"
  );
  const { service } = createExecutiveCommandCenter({
    createId: (prefix) => `${prefix}-${Date.now().toString(36)}`,
  });

  return service.build({
    requestId: `ecc-${Date.now().toString(36)}`,
    scope: {
      organizationId,
      schoolId,
    },
    role,
    periodLabel: "Executive Command Center",
  });
});

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
      <WidgetBoundary
        label="Operational loop"
        errorTitle="Unable to load operational loop"
        skeleton={<ExecutiveWidgetSkeleton label="Loading operational loop…" />}
      >
        <OperationalLoopDashboard summary={summary} gapReports={gapReports} />
      </WidgetBoundary>
    </div>
  );
}

async function CommandCenterBody() {
  const bundle = await loadCommandCenterBundle();
  if (!bundle) throw new Error("Command center data is unavailable.");

  return (
    <CommandCenterDashboard
      metrics={bundle.workspace.commandCenterMetrics}
      insights={bundle.insights}
      deadlineAnalytics={bundle.deadlineAnalytics}
      fiDashboard={bundle.fiDashboard}
    />
  );
}

async function IntelligenceCommandCenterBody({ role }: { role: CommandCenterRole }) {
  const result = await loadIntelligenceCommandCenter(role);
  if (!result) throw new Error("Intelligence command center is unavailable.");
  return <InteractiveCommandCenter result={result} />;
}

function ExecutiveIntelligenceCommandCenter({ role }: { role: CommandCenterRole }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Command Center"
        subtitle="Role-prioritized workspace from the intelligence pipeline"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/executive?view=legacy-command-center"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Legacy metrics
            </Link>
            <Link
              href="/dashboard/executive?work=today"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              ← Work queue
            </Link>
          </div>
        }
      />
      <WidgetBoundary
        label="Intelligence command center"
        errorTitle="Unable to load command center"
        skeleton={
          <div className="space-y-6">
            <KpiTilesSkeleton count={4} />
            <div className="grid gap-4 lg:grid-cols-2">
              <ExecutiveWidgetSkeleton variant="insights" />
              <ExecutiveWidgetSkeleton variant="scorecard" />
            </div>
          </div>
        }
      >
        <IntelligenceCommandCenterBody role={role} />
      </WidgetBoundary>
    </div>
  );
}

function ExecutiveLegacyCommandCenter() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Legacy Command Center"
        subtitle="Cross-module metrics from the prior command center view"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/executive?view=command-center"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Intelligence workspace
            </Link>
            <Link
              href="/dashboard/executive?work=today"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              ← Work queue
            </Link>
          </div>
        }
      />
      <WidgetBoundary
        label="Command center"
        errorTitle="Unable to load command center"
        skeleton={
          <div className="space-y-6">
            <KpiTilesSkeleton count={8} />
            <div className="grid gap-6 lg:grid-cols-3">
              <ExecutiveWidgetSkeleton variant="insights" className="lg:col-span-2" />
              <ExecutiveWidgetSkeleton variant="scorecard" />
            </div>
          </div>
        }
      >
        <CommandCenterBody />
      </WidgetBoundary>
    </div>
  );
}

async function ExecutiveOrgBar({ work }: { work?: string }) {
  const bundle = await loadExecutiveWorkBundle(work);
  if (!bundle?.orgContext) return null;
  return <JagOrganizationContextBar org={bundle.orgContext} />;
}

async function ExecutiveKpiRow({ work }: { work?: string }) {
  const bundle = await loadExecutiveWorkBundle(work);
  if (!bundle) throw new Error("Executive metrics are unavailable.");

  const { mergedQueue, workPerspective, perspectiveLabel, intelligence } = bundle;
  const activeItems = mergedQueue.perspectives[workPerspective] ?? [];
  const metrics = intelligence.commandCenterMetrics;

  return (
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
  );
}

async function ExecutiveWorkQueueWidget({ work }: { work?: string }) {
  const bundle = await loadExecutiveWorkBundle(work);
  if (!bundle) throw new Error("Executive work queue is unavailable.");
  return <JagWorkPanel queue={bundle.mergedQueue} perspective={bundle.workPerspective} />;
}

async function ExecutiveInsightSidePanel({ work }: { work?: string }) {
  const bundle = await loadExecutiveWorkBundle(work);
  if (!bundle) throw new Error("Executive insights are unavailable.");
  const { orgContext } = bundle;

  return (
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
  );
}

function staticExecutiveNav(activeId: string): XesNavItem[] {
  return EXECUTIVE_WORK_PERSPECTIVES.map((p) => ({
    id: p.id,
    label: p.label,
    href: `/dashboard/executive?work=${p.id}`,
    active: p.id === activeId,
  }));
}

export async function ExecutivePageContent({ searchParams }: ExecutivePageContentProps) {
  const sp = await searchParams;
  if (sp.view === "operational-loop") {
    return <ExecutiveOperationalLoopView />;
  }
  if (sp.view === "command-center") {
    return (
      <ExecutiveIntelligenceCommandCenter role={resolveCommandCenterRole(sp.role)} />
    );
  }
  if (sp.view === "legacy-command-center") {
    return <ExecutiveLegacyCommandCenter />;
  }

  const workPerspective = resolveJagWorkPerspective("executive", sp.work);
  const perspectiveLabel =
    EXECUTIVE_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work";

  // Shell renders immediately with static nav — widgets stream data independently.
  return (
    <ExecutiveExperienceShell
      breadcrumbs={[
        { label: "Executive Intelligence", href: "/dashboard/executive?work=today" },
        { label: perspectiveLabel },
      ]}
      navItems={staticExecutiveNav(workPerspective)}
      subtitle="Strategic oversight"
      insightPanel={
        <WidgetBoundary
          label="Executive insights"
          errorTitle="Unable to load insights"
          skeleton={<ListSkeleton rows={4} label="Loading insights…" />}
        >
          <ExecutiveInsightSidePanel work={sp.work} />
        </WidgetBoundary>
      }
    >
      <WidgetBoundary
        label="Organization context"
        errorTitle="Unable to load organization context"
        skeleton={null}
      >
        <ExecutiveOrgBar work={sp.work} />
      </WidgetBoundary>

      <WidgetBoundary
        label="Executive KPIs"
        errorTitle="Unable to load executive metrics"
        skeleton={<KpiTilesSkeleton count={4} label="Loading executive metrics…" />}
      >
        <ExecutiveKpiRow work={sp.work} />
      </WidgetBoundary>

      <WidgetBoundary
        label="Executive work queue"
        errorTitle="Unable to load work queue"
        skeleton={<ListSkeleton rows={8} label="Loading work queue…" />}
      >
        <ExecutiveWorkQueueWidget work={sp.work} />
      </WidgetBoundary>
    </ExecutiveExperienceShell>
  );
}

export function ExecutivePageSkeleton() {
  const shell = progressiveShellProps("executive");
  return (
    <ProgressivePageShell
      title={shell.title}
      subtitle={shell.subtitle}
      breadcrumbs={shell.breadcrumbs}
      sidebarItems={shell.sidebarItems}
      label={shell.label}
      showDefaultBody={false}
    >
      <KpiTilesSkeleton count={4} />
      <ListSkeleton rows={8} />
    </ProgressivePageShell>
  );
}
