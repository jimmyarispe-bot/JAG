import {
  AiInsightCard,
  AiRecommendationCard,
  ExecutionPipeline,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  KpiTilesSkeleton,
  ListSkeleton,
  MetricCard,
  ProgressivePageShell,
  QuickActions,
  TeacherExperienceShell,
  progressiveShellProps,
  type XesNavItem,
  type XesWorkspaceOption,
} from "@/components/experience-system";
import { DASHBOARD_MODULES } from "@/lib/dashboard/navigation";
import { formatCount } from "@/lib/format";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolveJagProfilesForStudents } from "@/lib/platform/jag-profile";
import {
  JAG_WORK_PERSPECTIVES,
  resolveJagWorkPerspective,
  resolveJagWorkQueue,
} from "@/lib/platform/jag-work";
import type { ResolveTeacherJagWorkInput } from "@/lib/platform/jag-work";
import {
  getTeacherComplianceItems,
  getTeacherEmployeeId,
  getTeacherInterventions,
  getTeacherRosterStudents,
  getTeacherTodaySessions,
  getTeacherWorkloadSummary,
} from "@/lib/teacher/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getTeacherDocumentationDeadlines } from "@/lib/compliance/deadlines";
import { TEACHER_QUICK_ACTIONS } from "@/lib/teacher/experience/constants";
import { getTeacherExperience } from "@/lib/teacher/experience/orchestrator";

const WORKSPACE_SWITCHER_IDS = new Set(["executive", "students", "scheduling", "teacher"]);

interface TeacherPageContentProps {
  searchParams: Promise<{
    work?: string;
    workflow?: string;
    task?: string;
    view?: string;
    student?: string;
    session?: string;
  }>;
}

export async function TeacherPageContent({ searchParams }: TeacherPageContentProps) {
  const sp = await searchParams;
  const ctx = await getIdentityContext();

  if (!ctx) {
    return null;
  }

  const workPerspective = resolveJagWorkPerspective("teacher", sp.work ?? sp.workflow ?? sp.task ?? sp.view);

  // P004: overlap engine with auth + employee resolution (independent of recommendations).
  const [execution, { supabase, employeeId }] = await Promise.all([
    executeWorkspace({
      workspaceKey: "teacher",
      identity: ctx,
      activeView: workPerspective,
      recommendationFacts: { has_permission: ctx.permissions.length > 0 },
    }),
    createAuthClient().then(async (supabase) => ({
      supabase,
      employeeId: await getTeacherEmployeeId(supabase, ctx.effectiveUserId),
    })),
  ]);

  const workspaceState = execution.state;

  if (!employeeId) {
    return (
      <TeacherExperienceShell navItems={[]} fullName={ctx.fullName} roleLabel={ctx.roleLabel}>
        <div className="mx-auto max-w-3xl py-12 text-center">
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Your user account is not linked to an active employee record. Contact your administrator to enable the Teacher Workspace.
          </p>
        </div>
      </TeacherExperienceShell>
    );
  }

  const [sessions, workload, legacyCompliance, docDeadlines, rosterStudents, interventions] =
    await Promise.all([
      getTeacherTodaySessions(supabase, employeeId),
      getTeacherWorkloadSummary(supabase, employeeId),
      getTeacherComplianceItems(supabase, employeeId),
      getTeacherDocumentationDeadlines(supabase, employeeId),
      getTeacherRosterStudents(supabase, employeeId),
      getTeacherInterventions(supabase, employeeId),
    ]);

  const compliance = [
    ...docDeadlines,
    ...legacyCompliance.filter((item) => !docDeadlines.some((d) => d.title === item.title)),
  ];

  const sessionStudentIds = [
    ...new Set(
      sessions.flatMap((s) =>
        s.students
          .map((st: { id?: string }) => st.id)
          .filter((id: string | undefined): id is string => Boolean(id))
      )
    ),
  ];

  const jagProfilesByStudent = await resolveJagProfilesForStudents(supabase, sessionStudentIds, {
    identity: ctx,
  });

  const engineRecommendations = workspaceState?.recommendations ?? [];

  const workQueue = await resolveJagWorkQueue({
    workspaceKey: "teacher",
    input: {
      supabase,
      identity: ctx,
      employeeId,
      activePerspective: workPerspective,
      sessions: sessions.map((s) => ({
        id: s.id,
        timeDisplay: s.timeDisplay,
        lessonStatus: s.lessonStatus,
        course: s.course as { name?: string } | null,
        section: s.section as { section_code?: string } | null,
        students: s.students,
        alerts: s.alerts,
      })),
      compliance,
      interventions: interventions as ResolveTeacherJagWorkInput["interventions"],
      engineRecommendations,
      executionState: workspaceState,
      jagProfilesByStudent,
    },
  });

  const navItems: XesNavItem[] = (workspaceState?.navigation ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    active: item.id === workPerspective,
    badge: workQueue.counts[item.id] || undefined,
  }));

  const workspaces: XesWorkspaceOption[] = DASHBOARD_MODULES.filter((m) =>
    WORKSPACE_SWITCHER_IDS.has(m.id)
  ).map((m) => ({
    id: m.id,
    label: m.sidebarLabel,
    href: m.href,
    description: m.pageSubtitle,
    active: m.id === "teacher",
  }));

  const nextPending = sessions.find(
    (s) => !["completed", "complete", "documented"].includes(s.lessonStatus.toLowerCase())
  );

  const { data: teacherEmployee } = await supabase
    .from("employees")
    .select("organization_id, school_id")
    .eq("id", employeeId)
    .maybeSingle();

  getTeacherExperience().publishDashboardViewed({
    organizationId:
      (teacherEmployee as { organization_id?: string } | null)?.organization_id ??
      (teacherEmployee as { school_id?: string } | null)?.school_id ??
      ctx.orgAssignments[0]?.school_id ??
      "default",
    actorUserId: ctx.effectiveUserId,
    employeeId,
  });

  const orgContext = workspaceState?.org ?? null;
  const orgScopeLabel =
    orgContext?.activeScope.schoolName ??
    orgContext?.activeScope.organizationName ??
    "Your organization";

  const insightPanel = (
    <div className="space-y-4">
      {orgContext && <JagOrganizationContextPanel org={orgContext} />}
      <ExecutionPipeline title="Work resolution" currentStepId="execute" compact />
      {engineRecommendations.slice(0, 2).map((rec) => (
        <AiRecommendationCard
          key={rec.id}
          recommendation={{
            ...rec,
            confidence: rec.priority === "high" ? 88 : rec.priority === "low" ? 52 : 72,
            knowledge: (workspaceState?.knowledge ?? []).slice(0, 2).map((k) => ({
              id: k.nodeKey,
              title: k.title,
              layerKind: k.kind,
            })),
          }}
        />
      ))}
      {workload.missionControlAlerts > 0 && (
        <AiInsightCard
          title="Mission Control alert"
          insight={`You have ${workload.missionControlAlerts} open alert${workload.missionControlAlerts === 1 ? "" : "s"} requiring attention.`}
          confidence={90}
          source="Mission Control"
        />
      )}
      <QuickActions
        title="Work shortcuts"
        actions={[
          ...(nextPending
            ? [{
                id: "open-session",
                label: "Open next session",
                href: `/dashboard/teacher/sessions/${nextPending.id}?from=work`,
                variant: "primary" as const,
              }]
            : []),
          ...TEACHER_QUICK_ACTIONS.map((a) => ({
            id: a.href,
            label: a.label,
            href: a.href,
            variant: "secondary" as const,
          })),
          {
            id: "priorities",
            label: "Highest priorities",
            href: "/dashboard/teacher?work=highest_priorities",
            variant: workPerspective === "highest_priorities" ? "primary" : "secondary",
          },
          {
            id: "family",
            label: "Family communication",
            href: "/dashboard/teacher?work=ready_for_family_communication",
            variant: workPerspective === "ready_for_family_communication" ? "primary" : "secondary",
          },
        ]}
      />
    </div>
  );

  const perspectiveLabel =
    JAG_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work";

  const breadcrumbs = [
    { label: "Teacher Workspace", href: "/dashboard/teacher?work=today" },
    { label: perspectiveLabel },
  ];

  const activeItems = workQueue.perspectives[workPerspective] ?? [];

  const metrics = [
    {
      title: "Work in queue",
      value: formatCount(activeItems.length),
      description: perspectiveLabel,
      accent: "brand" as const,
      icon: "W",
    },
    {
      title: "Today's total",
      value: formatCount(workQueue.counts.today),
      description: "All perspectives",
      accent: "indigo" as const,
      icon: "T",
    },
    {
      title: "Ready to teach",
      value: formatCount(workQueue.counts.ready_to_teach),
      description: "Sessions pending",
      accent: "sky" as const,
      icon: "D",
    },
    {
      title: "Needs decision",
      value: formatCount(workQueue.counts.needs_human_decision),
      description: "Human judgment required",
      accent: "amber" as const,
      icon: "!",
    },
  ];

  return (
    <TeacherExperienceShell
      breadcrumbs={breadcrumbs}
      navItems={navItems}
      workspaces={workspaces}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      insightPanel={insightPanel}
      subtitle={`The JAG Work™ — ${orgScopeLabel}`}
    >
      {orgContext && <JagOrganizationContextBar org={orgContext} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            description={m.description}
            accent={m.accent}
            icon={<span className="text-lg font-bold">{m.icon}</span>}
          />
        ))}
      </div>

      <JagWorkPanel queue={workQueue} perspective={workPerspective} />
    </TeacherExperienceShell>
  );
}

export function TeacherPageSkeleton() {
  return (
    <ProgressivePageShell {...progressiveShellProps("teacher")} showDefaultBody={false}>
      <KpiTilesSkeleton count={4} />
      <ListSkeleton rows={8} />
    </ProgressivePageShell>
  );
}
