import Link from "next/link";
import {
  ExecutionPipeline,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  MetricCard,
  QuickActions,
  StudentsExperienceShell,
  type XesNavItem,
} from "@/components/experience-system";
import { StatCard } from "@/components/dashboard/StatCard";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { FundingBreakdown } from "@/components/ui/FundingBreakdown";
import { StudentList } from "@/components/students/StudentList";
import { FamilyList } from "@/components/students/FamilyList";
import { StudentForm } from "@/components/students/StudentForm";
import { formatCount } from "@/lib/format";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { STUDENTS_WORK_PERSPECTIVES, resolveJagWorkPerspective, resolveJagWorkQueue } from "@/lib/platform/jag-work";
import { getFamilies, getSchools, getSchoolYears, getStudents, getStudentStats } from "@/lib/students/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";
import "@/lib/platform/execution-engine";

export const STUDENT_TABS = [
  { href: "/dashboard/students?view=students", label: "Students", value: "students" },
  { href: "/dashboard/students?view=families", label: "Families", value: "families" },
  { href: "/dashboard/students?view=add", label: "Add Student", value: "add" },
] as const;

interface StudentsPageContentProps {
  searchParams: Promise<{ view?: string; work?: string }>;
}

async function StudentsLegacyView({ view }: { view: string }) {
  const [students, families, stats, schools, schoolYears] = await Promise.all([
    getStudents(),
    getFamilies(),
    getStudentStats(),
    getSchools(),
    getSchoolYears(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Student Success (SSIS)"
        subtitle="Unified profiles from acceptance through graduation"
        actions={
          <Link href="/dashboard/students?work=today" className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            ← Work queue
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={formatCount(stats.total)} description="All records" accent="indigo" icon={<span className="text-lg font-bold">S</span>} />
        <StatCard title="Enrolled" value={formatCount(stats.enrolled)} description="Enrolled" accent="emerald" icon={<span className="text-lg font-bold">E</span>} />
        <StatCard title="Pending" value={formatCount(stats.pending)} description="Pending enrollment" accent="amber" icon={<span className="text-lg font-bold">P</span>} />
        <StatCard title="Families" value={formatCount(families.length)} description="Registered families" accent="sky" icon={<span className="text-lg font-bold">F</span>} />
      </div>
      <ViewTabs tabs={[...STUDENT_TABS]} activeView={view} />
      {view === "students" && <FundingBreakdown title="Funding Report" byFunding={stats.byFunding} byCategory={stats.byCategory} />}
      {view === "families" ? <FamilyList families={families} /> : view === "add" ? <StudentForm schools={schools} families={families} schoolYears={schoolYears} /> : <StudentList students={students} />}
    </div>
  );
}

export async function StudentsPageContent({ searchParams }: StudentsPageContentProps) {
  const sp = await searchParams;
  const legacyViews = new Set(STUDENT_TABS.map((t) => t.value));
  if (sp.view && legacyViews.has(sp.view as (typeof STUDENT_TABS)[number]["value"])) {
    return <StudentsLegacyView view={sp.view} />;
  }

  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const workPerspective = resolveJagWorkPerspective("students", sp.work);
  const execution = await executeWorkspace({
    workspaceKey: "students",
    identity: ctx,
    activeView: workPerspective,
    recommendationFacts: { has_permission: ctx.permissions.length > 0 },
  });
  const workspaceState = execution.state;
  const supabase = await createAuthClient();
  const [students, stats] = await Promise.all([getStudents(), getStudentStats()]);

  const workQueue = await resolveJagWorkQueue({
    workspaceKey: "students",
    input: {
      supabase,
      identity: ctx,
      activePerspective: workPerspective,
      students,
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
  const perspectiveLabel = STUDENTS_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work";
  const activeItems = workQueue.perspectives[workPerspective] ?? [];

  return (
    <StudentsExperienceShell
      breadcrumbs={[{ label: "Student Information", href: "/dashboard/students?work=today" }, { label: perspectiveLabel }]}
      navItems={navItems}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      subtitle={orgContext?.activeScope.schoolName ?? "Student Success (SSIS)"}
      insightPanel={
        <div className="space-y-4">
          {orgContext && <JagOrganizationContextPanel org={orgContext} />}
          <ExecutionPipeline title="Work resolution" currentStepId="execute" compact />
          <QuickActions
            title="Student shortcuts"
            actions={[
              { id: "list", label: "Student list", href: "/dashboard/students?view=students", variant: "secondary" },
              { id: "add", label: "Add student", href: "/dashboard/students?view=add", variant: "primary" },
              { id: "pending", label: "Enrollment pending", href: "/dashboard/students?work=enrollment_pending", variant: "secondary" },
            ]}
          />
        </div>
      }
    >
      {orgContext && <JagOrganizationContextBar org={orgContext} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Work in queue" value={formatCount(activeItems.length)} description={perspectiveLabel} accent="brand" icon={<span className="text-lg font-bold">W</span>} />
        <MetricCard title="Total students" value={formatCount(stats.total)} description="All records" accent="indigo" icon={<span className="text-lg font-bold">S</span>} />
        <MetricCard title="Enrollment pending" value={formatCount(workQueue.counts.enrollment_pending ?? 0)} description="Awaiting completion" accent="amber" icon={<span className="text-lg font-bold">P</span>} />
        <MetricCard title="Records incomplete" value={formatCount(workQueue.counts.records_incomplete ?? 0)} description="Profiles to fix" accent="sky" icon={<span className="text-lg font-bold">R</span>} />
      </div>
      <JagWorkPanel queue={workQueue} perspective={workPerspective} />
    </StudentsExperienceShell>
  );
}

export function StudentsPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  );
}
