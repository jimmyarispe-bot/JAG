import { QuickLaunchGrid } from "@/components/dashboard/QuickLaunchGrid";
import { FounderMorningBriefSections } from "@/components/dashboard/FounderMorningBriefSections";
import { FounderDashboardCards } from "@/components/dashboard/FounderDashboardCards";
import { FounderDashboardNav } from "@/components/dashboard/FounderDashboardNav";
import { ExecutiveDirectorDashboard } from "@/components/dashboard/ExecutiveDirectorDashboard";
import { getSessionUser } from "@/lib/auth/session";
import { canViewExecutiveDirectorDashboard } from "@/lib/dashboard/executive-director-dashboard";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { getFounderMorningBrief } from "@/lib/dashboard/morning-brief";
import { getVisibleQuickLaunchModuleIds } from "@/lib/dashboard/morning-brief-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding } from "@/lib/branding";

export default async function DashboardHomePage() {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const [sessionUser, branding] = await Promise.all([
    getSessionUser(),
    loadOrganizationBranding(supabase),
  ]);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Founder dashboard + widgets — FOUNDER role only
  if (canViewFounderDashboard(ctx)) {
    const brief = await getFounderMorningBrief(ctx);
    const { founderDashboard, executive } = brief;

    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-medium text-indigo-100">
            {greeting} · {today}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Founder &amp; CEO
          </h2>
          <p className="mt-2 text-sm text-indigo-100/90">
            Welcome back, {sessionUser?.fullName ?? "there"}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100/90 sm:text-base">
            Your founder operating home for {branding.productName}
            {branding.editionLabel ? ` · ${branding.editionLabel}` : ""}.
          </p>
          <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/20">
            Founder &amp; CEO
          </p>
        </section>

        <FounderDashboardNav />

        {executive && (
          <FounderMorningBriefSections
            executive={executive}
            missionControlLabel="Mission Control"
            intelligenceEngineLabel="Executive Intelligence"
          />
        )}

        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Key Metrics</h2>
            <p className="mt-1 text-sm text-slate-500">Founder-only live organizational snapshot</p>
          </div>
          <FounderDashboardCards
            data={founderDashboard}
            financialIntelligenceLabel={branding.financialIntelligenceLabel}
          />
        </section>
      </div>
    );
  }

  // Executive Director dashboard — no Founder widgets
  if (canViewExecutiveDirectorDashboard(ctx)) {
    return (
      <ExecutiveDirectorDashboard
        fullName={sessionUser?.fullName ?? "there"}
        roleLabel={sessionUser?.roleLabel ?? "Executive Director"}
        productName={branding.productName}
        greeting={greeting}
        today={today}
      />
    );
  }

  // Other AcademyOS roles — no founder widgets
  const visibleQuickLaunchModuleIds = getVisibleQuickLaunchModuleIds(ctx).filter(
    (id) => id !== "executive"
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">
          {greeting} · {today}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {branding.productName}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back, {sessionUser?.fullName ?? "there"}
        </p>
        {sessionUser?.roleLabel && (
          <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {sessionUser.roleLabel}
          </p>
        )}
      </section>

      <QuickLaunchGrid visibleModuleIds={visibleQuickLaunchModuleIds} />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
