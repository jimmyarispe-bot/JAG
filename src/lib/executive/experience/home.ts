/**
 * Executive home — org overview composed from existing executive services.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getExecutiveKPIs } from "@/lib/executive/kpis";
import { generateFounderMorningBrief } from "@/lib/executive/morning-brief";
import { getCommandCenterMetrics } from "@/lib/executive/command-center";
import { getNetworkDashboardBySchool } from "@/lib/executive/network-dashboard";
import { listAnnouncements } from "@/lib/communications/announcements";
import { EXECUTIVE_QUICK_ACTIONS } from "./constants";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getExecutiveExperienceHome(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [kpis, command, network, announcements] = await Promise.all([
    getExecutiveKPIs({
      supabase,
      schoolIds: schoolId ? [schoolId] : undefined,
    }).catch(() => null),
    getCommandCenterMetrics(supabase, schoolId ?? undefined).catch(() => null),
    getNetworkDashboardBySchool(supabase).catch(() => []),
    listAnnouncements(supabase, { schoolId, limit: 6 }),
  ]);

  const brief = kpis ? generateFounderMorningBrief(kpis) : null;

  const criticalAlerts = [
    ...(brief?.alerts.slice(0, 5).map((a, i) => ({
      id: `brief-${i}`,
      title: a,
      href: "/dashboard/executive/operations",
    })) ?? []),
    ...((command as { complianceAlerts?: number } | null)?.complianceAlerts
      ? [
          {
            id: "compliance",
            title: `${(command as { complianceAlerts: number }).complianceAlerts} compliance alert(s)`,
            href: "/dashboard/executive/compliance",
          },
        ]
      : []),
  ];

  const priorities = [
    ...(brief?.recommendedActions.slice(0, 5).map((a, i) => ({
      id: `action-${i}`,
      title: a,
      href: "/dashboard/executive/operations",
    })) ?? []),
    {
      id: "review-finance",
      title: "Review finance executive summaries",
      href: "/dashboard/executive/finance",
    },
    {
      id: "review-strategy",
      title: "Check strategic initiatives",
      href: "/dashboard/executive/strategy",
    },
  ];

  return {
    overview: {
      campusCount: network.length,
      enrollment: kpis?.enrollment ?? network.reduce((s, r) => s + r.enrollment, 0),
      revenue: kpis?.revenue ?? network.reduce((s, r) => s + r.revenue, 0),
      activeStaff: network.reduce((s, r) => s + r.activeStaff, 0),
    },
    brief,
    organizationHealth: {
      priority: brief?.priority ?? "GREEN",
      summary: brief?.summary ?? "Open Command Center for live organizational health.",
    },
    criticalAlerts,
    priorities,
    announcements,
    quickActions: EXECUTIVE_QUICK_ACTIONS,
    deepLinks: {
      commandCenter: "/dashboard/executive",
      network: "/dashboard/executive/network",
      kpis: "/dashboard/executive/kpis",
      board: "/dashboard/executive/board",
    },
  };
}
