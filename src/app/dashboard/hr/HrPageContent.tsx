import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ExecutionPipeline,
  HrExperienceShell,
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
  JagWorkPanel,
  MetricCard,
  QuickActions,
  type XesNavItem,
} from "@/components/experience-system";
import { StatCard } from "@/components/dashboard/StatCard";
import { HrTabs } from "@/components/hr/HrTabs";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCount } from "@/lib/format";
import {
  computeHrStats,
  getCertifications,
  getEmployees,
  getPayrollRecords,
  getPositions,
  getSchools,
  getSubstitutes,
  getVolunteers,
} from "@/lib/hr/queries";
import { canAccessHrAdmin, canRunPayroll } from "@/lib/hr/access";
import { getRecruitingPipeline, getComplianceCenter } from "@/lib/hr/employee-profile";
import { getWorkforceAnalytics, getOrgChart } from "@/lib/hr/analytics";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";
import { HR_WORK_PERSPECTIVES, resolveJagWorkPerspective, resolveJagWorkQueue } from "@/lib/platform/jag-work";
import { createAuthClient } from "@/lib/supabase/server-auth";
import "@/lib/platform/execution-engine";

export const HR_TABS = [
  { href: "/dashboard/hr?view=employees", label: "Employees", value: "employees" },
  { href: "/dashboard/hr?view=recruiting", label: "Recruiting", value: "recruiting" },
  { href: "/dashboard/hr?view=compliance", label: "Compliance", value: "compliance" },
  { href: "/dashboard/hr?view=positions", label: "Positions", value: "positions" },
  { href: "/dashboard/hr?view=certifications", label: "Certifications", value: "certifications" },
  { href: "/dashboard/hr?view=payroll", label: "Payroll", value: "payroll" },
  { href: "/dashboard/hr?view=analytics", label: "Analytics", value: "analytics" },
  { href: "/dashboard/hr?view=workforce", label: "Substitutes & Volunteers", value: "workforce" },
  { href: "/dashboard/hr?view=create", label: "Add", value: "create" },
] as const;

interface HrPageContentProps {
  searchParams: Promise<{ view?: string; work?: string }>;
}

async function HrLegacyView({ view, ctx }: { view: string; ctx: NonNullable<Awaited<ReturnType<typeof getIdentityContext>>> }) {
  const schoolId = resolvePrimarySchoolId(ctx) ?? undefined;
  const supabase = await createAuthClient();

  const [employees, positions, certifications, payroll, schools, recruiting, compliance, analytics, orgChart, substitutes, volunteers] =
    await Promise.all([
      getEmployees(),
      getPositions(),
      getCertifications(),
      getPayrollRecords(),
      getSchools(),
      getRecruitingPipeline(supabase, schoolId),
      getComplianceCenter(supabase, schoolId),
      getWorkforceAnalytics(supabase, schoolId),
      schoolId ? getOrgChart(supabase, schoolId) : Promise.resolve({ nodes: [], openPositions: [] }),
      getSubstitutes(schoolId),
      getVolunteers(schoolId),
    ]);

  const stats = computeHrStats(employees, certifications, payroll);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Human Capital & Workforce" subtitle="Recruiting, credentials, payroll, and analytics" />
        <div className="flex gap-2">
          <Link href="/dashboard/hr?work=today" className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            ← Work queue
          </Link>
          <Link href="/dashboard/employee" className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
            Employee portal →
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Staff" value={formatCount(stats.activeEmployees)} description="Active employees" accent="indigo" icon={<span className="text-lg font-bold">E</span>} />
        <StatCard title="Open Jobs" value={formatCount(recruiting.jobs.filter((j) => j.status === "open").length)} description="Recruiting pipeline" accent="sky" icon={<span className="text-lg font-bold">J</span>} />
        <StatCard title="Expiring Certs" value={formatCount(stats.expiringCerts)} description="Within 90 days" accent="amber" icon={<span className="text-lg font-bold">C</span>} />
        <StatCard title="Pending Payroll" value={formatCount(stats.pendingPayroll)} description="Awaiting approval" accent="violet" icon={<span className="text-lg font-bold">P</span>} />
      </div>
      <ViewTabs tabs={[...HR_TABS]} activeView={view} />
      <HrTabs
        view={view}
        employees={employees}
        positions={positions}
        certifications={certifications}
        payroll={payroll}
        schools={schools}
        jobs={recruiting.jobs}
        applications={recruiting.applications}
        compliance={compliance}
        analytics={analytics}
        orgChart={orgChart}
        substitutes={substitutes}
        volunteers={volunteers}
        canRunPayroll={canRunPayroll(ctx)}
      />
    </div>
  );
}

export async function HrPageContent({ searchParams }: HrPageContentProps) {
  const sp = await searchParams;
  const ctx = await getIdentityContext();
  if (!ctx || !canAccessHrAdmin(ctx)) redirect("/dashboard");

  const legacyViews = new Set(HR_TABS.map((t) => t.value));
  if (sp.view && legacyViews.has(sp.view as (typeof HR_TABS)[number]["value"])) {
    return <HrLegacyView view={sp.view} ctx={ctx} />;
  }

  const workPerspective = resolveJagWorkPerspective("hr", sp.work);
  const execution = await executeWorkspace({
    workspaceKey: "hr",
    identity: ctx,
    activeView: workPerspective,
    recommendationFacts: { has_permission: ctx.permissions.length > 0 },
  });
  const workspaceState = execution.state;
  const schoolId = resolvePrimarySchoolId(ctx) ?? undefined;
  const supabase = await createAuthClient();

  const [recruiting, compliance, employees, certifications, payroll] = await Promise.all([
    getRecruitingPipeline(supabase, schoolId),
    getComplianceCenter(supabase, schoolId),
    getEmployees(),
    getCertifications(),
    getPayrollRecords(),
  ]);
  const stats = computeHrStats(employees, certifications, payroll);

  const workQueue = await resolveJagWorkQueue({
    workspaceKey: "hr",
    input: {
      supabase,
      identity: ctx,
      activePerspective: workPerspective,
      applications: recruiting.applications,
      expiringCertifications: compliance.expiringCertifications,
      pendingOnboarding: compliance.pendingOnboarding,
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
  const perspectiveLabel = HR_WORK_PERSPECTIVES.find((p) => p.id === workPerspective)?.label ?? "Today's Work";
  const activeItems = workQueue.perspectives[workPerspective] ?? [];

  return (
    <HrExperienceShell
      breadcrumbs={[{ label: "Human Resources", href: "/dashboard/hr?work=today" }, { label: perspectiveLabel }]}
      navItems={navItems}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      subtitle={orgContext?.activeScope.schoolName ?? "Workforce operations"}
      insightPanel={
        <div className="space-y-4">
          {orgContext && <JagOrganizationContextPanel org={orgContext} />}
          <ExecutionPipeline title="Work resolution" currentStepId="execute" compact />
          <QuickActions
            title="HR shortcuts"
            actions={[
              { id: "recruiting", label: "Recruiting", href: "/dashboard/hr?view=recruiting", variant: "secondary" },
              { id: "compliance", label: "Compliance due", href: "/dashboard/hr?work=compliance_due", variant: "primary" },
              { id: "portal", label: "Employee portal", href: "/dashboard/employee", variant: "secondary" },
            ]}
          />
        </div>
      }
    >
      {orgContext && <JagOrganizationContextBar org={orgContext} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Work in queue" value={formatCount(activeItems.length)} description={perspectiveLabel} accent="brand" icon={<span className="text-lg font-bold">W</span>} />
        <MetricCard title="Active staff" value={formatCount(stats.activeEmployees)} description="Employees" accent="indigo" icon={<span className="text-lg font-bold">E</span>} />
        <MetricCard title="Compliance due" value={formatCount(workQueue.counts.compliance_due ?? 0)} description="Certs & tasks" accent="amber" icon={<span className="text-lg font-bold">C</span>} />
        <MetricCard title="Ready to onboard" value={formatCount(workQueue.counts.ready_to_onboard ?? 0)} description="Onboarding tasks" accent="emerald" icon={<span className="text-lg font-bold">O</span>} />
      </div>
      <JagWorkPanel queue={workQueue} perspective={workPerspective} />
    </HrExperienceShell>
  );
}

export function HrPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  );
}
