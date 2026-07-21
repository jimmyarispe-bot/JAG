import Link from "next/link";
import {
  ExecutionPipeline,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  KpiTilesSkeleton,
  ListSkeleton,
  MetricCard,
  ProgressivePageShell,
  QuickActions,
  SchedulingExperienceShell,
  progressiveShellProps,
  type XesNavItem,
} from "@/components/experience-system";
import { StatCard } from "@/components/dashboard/StatCard";
import { SchedulingTabs } from "@/components/scheduling/SchedulingTabs";
import { RunIntelligenceButton } from "@/components/scheduling/SchedulingActions";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCount } from "@/lib/format";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";
import {
  SCHEDULING_WORK_PERSPECTIVES,
  resolveJagWorkPerspective,
  resolveJagWorkQueue,
} from "@/lib/platform/jag-work";
import {
  generateSchedulingRecommendations,
  getExecutiveSchedulingAnalytics,
} from "@/lib/scheduling/intelligence";
import {
  getAcademicCalendarEvents,
  getCourseSections,
  getScheduleConflicts,
  getScheduleRooms,
  getSchedulingExecutiveStats,
  getStaffWorkload,
  getStudentsWithoutSectionMatch,
  getUpcomingSessions,
} from "@/lib/scheduling/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";
import "@/lib/platform/execution-engine";

export const SCHEDULING_TABS = [
  { href: "/dashboard/scheduling?view=executive", label: "Executive", value: "executive" },
  { href: "/dashboard/scheduling?view=calendar", label: "Calendar", value: "calendar" },
  { href: "/dashboard/scheduling?view=sections", label: "Sections", value: "sections" },
  { href: "/dashboard/scheduling?view=sessions", label: "Sessions", value: "sessions" },
  { href: "/dashboard/scheduling?view=rooms", label: "Rooms", value: "rooms" },
  { href: "/dashboard/scheduling?view=workload", label: "Workload", value: "workload" },
  { href: "/dashboard/scheduling?view=intelligence", label: "Intelligence", value: "intelligence" },
] as const;

interface SchedulingPageContentProps {
  searchParams: Promise<{ view?: string; work?: string }>;
}

async function SchedulingLegacyView({ view }: { view: string }) {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx?.accessibleSchoolIds[0] ||
    ctx?.orgAssignments[0]?.school_id;

  const fromDate = new Date();
  const from = fromDate.toISOString().split("T")[0];
  const toDate = new Date(fromDate);
  toDate.setUTCDate(toDate.getUTCDate() + 90);
  const to = toDate.toISOString().split("T")[0];

  const [stats, sections, sessions, rooms, conflicts, calendarEvents, workload] = await Promise.all([
    getSchedulingExecutiveStats(schoolId),
    getCourseSections(schoolId),
    getUpcomingSessions(schoolId),
    getScheduleRooms(schoolId),
    getScheduleConflicts(schoolId),
    schoolId ? getAcademicCalendarEvents(schoolId, from, to) : Promise.resolve([]),
    schoolId ? getStaffWorkload(schoolId) : Promise.resolve([]),
  ]);

  const supabase = await createAuthClient();
  const recommendations = schoolId
    ? await generateSchedulingRecommendations(supabase, schoolId)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Academic Operations & Scheduling"
          subtitle="Enterprise scheduling engine — calendars, sessions, therapy, rooms, and Academy Way rules"
          actions={
            <Link
              href="/dashboard/scheduling?work=today"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              ← Work queue
            </Link>
          }
        />
        <RunIntelligenceButton schoolId={schoolId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sessions this week"
          value={formatCount(stats.sessionsThisWeek)}
          description="Scheduled instructional events"
          accent="indigo"
          icon={<span className="text-lg font-bold">S</span>}
        />
        <StatCard
          title="Open conflicts"
          value={formatCount(stats.openConflicts)}
          description="Requires attention"
          accent="rose"
          icon={<span className="text-lg font-bold">!</span>}
        />
        <StatCard
          title="Open sections"
          value={formatCount(stats.openSections)}
          description={`${stats.openSeats} total seats`}
          accent="emerald"
          icon={<span className="text-lg font-bold">§</span>}
        />
        <StatCard
          title="Utilization"
          value={`${stats.teacherUtilization}%`}
          description="Completed vs scheduled (7d)"
          accent="sky"
          icon={<span className="text-lg font-bold">U</span>}
        />
      </div>

      <ViewTabs tabs={[...SCHEDULING_TABS]} activeView={view} />

      <SchedulingTabs
        view={view}
        sections={sections}
        sessions={sessions}
        rooms={rooms}
        conflicts={conflicts}
        calendarEvents={calendarEvents}
        workload={workload}
        recommendations={recommendations}
      />
    </div>
  );
}

export async function SchedulingPageContent({ searchParams }: SchedulingPageContentProps) {
  const sp = await searchParams;
  const legacyViews = new Set(SCHEDULING_TABS.map((t) => t.value));

  if (sp.view && legacyViews.has(sp.view as (typeof SCHEDULING_TABS)[number]["value"])) {
    return <SchedulingLegacyView view={sp.view} />;
  }

  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const schoolId =
    resolvePrimarySchoolId(ctx) ??
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ??
    ctx.accessibleSchoolIds[0] ??
    ctx.orgAssignments[0]?.school_id;

  const workPerspective = resolveJagWorkPerspective("scheduling", sp.work);
  // P004: overlap engine with independent scheduling domain loads.
  const [execution, domain] = await Promise.all([
    executeWorkspace({
      workspaceKey: "scheduling",
      identity: ctx,
      activeView: workPerspective,
      recommendationFacts: { has_permission: ctx.permissions.length > 0 },
    }),
    (async () => {
      const supabase = await createAuthClient();
      const [conflicts, placementGaps, recommendations, analytics, stats] = await Promise.all([
        getScheduleConflicts(schoolId),
        schoolId ? getStudentsWithoutSectionMatch(schoolId) : Promise.resolve([]),
        schoolId ? generateSchedulingRecommendations(supabase, schoolId) : Promise.resolve([]),
        schoolId ? getExecutiveSchedulingAnalytics(supabase, schoolId) : Promise.resolve(null),
        getSchedulingExecutiveStats(schoolId),
      ]);
      return { supabase, conflicts, placementGaps, recommendations, analytics, stats };
    })(),
  ]);
  const workspaceState = execution.state;
  const { supabase, conflicts, placementGaps, recommendations, analytics, stats } = domain;

  const workQueue = await resolveJagWorkQueue({
    workspaceKey: "scheduling",
    input: {
      supabase,
      identity: ctx,
      activePerspective: workPerspective,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        title: c.title,
        description: c.description,
        recommendation: c.recommendation,
        is_resolved: c.is_resolved ?? false,
        metadata: (c.metadata as Record<string, unknown>) ?? undefined,
      })),
      placementGaps: placementGaps,
      recommendations,
      engineRecommendations: workspaceState?.recommendations ?? [],
      executionState: workspaceState,
    },
  });

  const navItems: XesNavItem[] = (workspaceState?.navigation ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    active: item.id === workPerspective,
    badge: workQueue.counts[item.id] || undefined,
  }));

  const orgContext = workspaceState?.org ?? null;
  const perspectiveLabel =
    SCHEDULING_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work";
  const activeItems = workQueue.perspectives[workPerspective] ?? [];

  return (
    <SchedulingExperienceShell
      breadcrumbs={[
        { label: "Scheduling Intelligence", href: "/dashboard/scheduling?work=today" },
        { label: perspectiveLabel },
      ]}
      navItems={navItems}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      subtitle={orgContext?.activeScope.schoolName ?? "Authoritative scheduling engine"}
      headerActions={schoolId ? <RunIntelligenceButton schoolId={schoolId} /> : undefined}
      insightPanel={
        <div className="space-y-4">
          {orgContext && <JagOrganizationContextPanel org={orgContext} />}
          <ExecutionPipeline title="Work resolution" currentStepId="execute" compact />
          <QuickActions
            title="Scheduling shortcuts"
            actions={[
              {
                id: "executive",
                label: "Executive dashboard",
                href: "/dashboard/scheduling?view=executive",
                variant: "secondary",
              },
              {
                id: "sections",
                label: "Sections & sessions",
                href: "/dashboard/scheduling?view=sections",
                variant: "secondary",
              },
              {
                id: "conflicts",
                label: "Conflicts due",
                href: "/dashboard/scheduling?work=conflicts_due",
                variant: "primary",
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
          title="Open conflicts"
          value={formatCount(stats.openConflicts)}
          description="Requires resolution"
          accent="rose"
          icon={<span className="text-lg font-bold">!</span>}
        />
        <MetricCard
          title="Placement gaps"
          value={formatCount(workQueue.counts.placement_gaps ?? 0)}
          description="Students without section"
          accent="amber"
          icon={<span className="text-lg font-bold">P</span>}
        />
        <MetricCard
          title="Avg utilization"
          value={analytics ? `${analytics.avgUtilization}%` : `${stats.teacherUtilization}%`}
          description={`${analytics?.sectionCount ?? stats.openSections} open sections`}
          accent="sky"
          icon={<span className="text-lg font-bold">U</span>}
        />
      </div>
      <JagWorkPanel queue={workQueue} perspective={workPerspective} />
    </SchedulingExperienceShell>
  );
}

export function SchedulingPageSkeleton() {
  return (
    <ProgressivePageShell {...progressiveShellProps("scheduling")} showDefaultBody={false}>
      <KpiTilesSkeleton count={4} />
      <ListSkeleton rows={8} />
    </ProgressivePageShell>
  );
}
