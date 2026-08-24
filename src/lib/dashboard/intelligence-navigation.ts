/**
 * Executive + Intelligence sidebar sections for AcademyOS.
 *
 * Every entry carries the exact permission keys its page guard checks, so the
 * menu and the pages agree. A link the current role cannot open is never drawn.
 *
 * This matters: the previous behaviour drew every module regardless of
 * permission and let the page redirect on click, which made a correctly
 * functioning platform look completely broken — fourteen links that all
 * bounced to the home page.
 *
 * Guard sources (keep in sync):
 *   /dashboard/executive/*      app/dashboard/executive/layout.tsx
 *                               -> canAccessExecutiveIntelligence | canViewEdi
 *   /dashboard/mission-control  app/dashboard/mission-control/layout.tsx
 *                               -> requirePagePermission("mission_control.access")
 *   /dashboard/network/*        app/dashboard/network/layout.tsx
 *                               -> canViewIntelligenceNetwork
 *   /dashboard/finance/*        app/dashboard/finance/layout.tsx
 *                               -> requireFinanceAccess -> FINANCE_ACCESS
 */

export interface SidebarNavItem {
  readonly href: string;
  readonly label: string;
  /** Holding any one of these permissions is enough to open the page. */
  readonly anyOf: readonly string[];
  /** Match the pathname exactly rather than by prefix. */
  readonly exact?: boolean;
}

export interface SidebarNavSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly SidebarNavItem[];
}

/** Permissions accepted by the shared /dashboard/executive layout guard. */
const EXECUTIVE_ENTRY = [
  "executive.intelligence",
  "executive.dashboard",
  "global.reporting",
  "edi.view",
  "edi.executive",
  "edi.manage",
  "edi.board",
] as const;

export const EXECUTIVE_NAV_SECTION: SidebarNavSection = {
  id: "executive",
  title: "Executive",
  items: [
    {
      href: "/dashboard/executive",
      label: "Executive Workspace",
      anyOf: EXECUTIVE_ENTRY,
      exact: true,
    },
    {
      href: "/dashboard/mission-control",
      label: "Mission Control",
      anyOf: ["mission_control.access"],
    },
    {
      href: "/dashboard/executive/briefings",
      label: "Briefings",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/kpis",
      label: "KPIs",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/board",
      label: "Board Reports",
      anyOf: [...EXECUTIVE_ENTRY, "executive.board_reports"],
    },
  ],
};

export const INTELLIGENCE_NAV_SECTION: SidebarNavSection = {
  id: "intelligence",
  title: "Intelligence",
  items: [
    {
      href: "/dashboard/executive/forecasting",
      label: "Forecasting",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/risk",
      label: "Risk",
      anyOf: [...EXECUTIVE_ENTRY, "executive.risk_view"],
    },
    {
      href: "/dashboard/executive/scenarios",
      label: "Scenarios",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/decisions",
      label: "Decisions",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/recommendations",
      label: "Recommendations",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/strategy",
      label: "Strategy",
      anyOf: [...EXECUTIVE_ENTRY, "executive.strategic"],
    },
    {
      href: "/dashboard/executive/benchmarks",
      label: "Benchmarks",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/executive/capacity",
      label: "Capacity",
      anyOf: EXECUTIVE_ENTRY,
    },
    {
      href: "/dashboard/network",
      label: "Intelligence Network",
      anyOf: ["network.view", "network.manage", "network.admin", "executive.intelligence"],
    },
    {
      href: "/dashboard/finance/intelligence",
      label: "Financial Intelligence",
      anyOf: ["FINANCE_ACCESS"],
    },
  ],
};

export const SIDEBAR_NAV_SECTIONS: readonly SidebarNavSection[] = [
  EXECUTIVE_NAV_SECTION,
  INTELLIGENCE_NAV_SECTION,
];

/** Items in this section the given permission set can actually open. */
export function visibleSectionItems(
  section: SidebarNavSection,
  permissions: readonly string[]
): SidebarNavItem[] {
  const granted = new Set(permissions);
  return section.items.filter((item) => item.anyOf.some((key) => granted.has(key)));
}

/** True when the pathname is inside this nav item. */
export function isSidebarItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
