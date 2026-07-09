import { QuickLaunchGrid } from "@/components/dashboard/QuickLaunchGrid";
import { FounderMorningBriefSections } from "@/components/dashboard/FounderMorningBriefSections";
import { FounderDashboardCards } from "@/components/dashboard/FounderDashboardCards";
import { getSessionUser } from "@/lib/auth/session";
import { getFounderMorningBrief } from "@/lib/dashboard/morning-brief";
import {
  canViewExecutiveIntelligenceLink,
  canViewMissionControlLink,
  getVisibleQuickLaunchModuleIds,
} from "@/lib/dashboard/morning-brief-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding } from "@/lib/branding";

export default async function FounderMorningBriefPage() {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const [sessionUser, brief, branding] = await Promise.all([
    getSessionUser(),
    getFounderMorningBrief(ctx),
    loadOrganizationBranding(supabase),
  ]);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const { founderDashboard, executive } = brief;
  const visibleQuickLaunchModuleIds = getVisibleQuickLaunchModuleIds(ctx);
  const showMissionControlLink = executive && canViewMissionControlLink(ctx);
  const showExecutiveLink = canViewExecutiveIntelligenceLink(ctx);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-indigo-100">
          {greeting} · {today}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {branding.founderWorkspaceLabel}
        </h2>
        <p className="mt-2 text-sm text-indigo-100/90">
          Welcome back, {sessionUser?.fullName ?? "there"}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-indigo-100/90 sm:text-base">
          Your daily operating snapshot for {branding.productName}
          {branding.editionLabel ? ` · ${branding.editionLabel}` : ""}.
          {executive
            ? " Start with priorities and decisions, then scan key metrics."
            : " Monitor enrollment, admissions, and organizational health at a glance."}
        </p>
        {(showMissionControlLink || showExecutiveLink) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {showMissionControlLink && (
              <a
                href="/dashboard/mission-control"
                className="inline-flex rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                Open {branding.missionControlLabel} →
              </a>
            )}
            {showExecutiveLink && (
              <a
                href="/dashboard/executive"
                className="inline-flex rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                Open {branding.intelligenceEngineLabel} →
              </a>
            )}
          </div>
        )}
        {sessionUser?.roleLabel && (
          <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/20">
            {sessionUser.roleLabel}
          </p>
        )}
      </section>

      {executive && (
        <FounderMorningBriefSections
          executive={executive}
          missionControlLabel={branding.missionControlLabel}
          intelligenceEngineLabel={branding.intelligenceEngineLabel}
        />
      )}

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Key Metrics</h2>
          <p className="mt-1 text-sm text-slate-500">Live data from your organization</p>
        </div>
        <FounderDashboardCards
          data={founderDashboard}
          financialIntelligenceLabel={branding.financialIntelligenceLabel}
        />
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
