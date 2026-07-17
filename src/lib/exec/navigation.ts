/**
 * Executive Command Center primary navigation (spec §1 order).
 * Phase 1 screens are enabled; later screens are listed but not yet routed.
 */

export type ExecNavItem = {
  id: string;
  label: string;
  href: string;
  phase: 1 | 2 | 3;
  exact?: boolean;
};

export const EXEC_NAV: ExecNavItem[] = [
  { id: "home", label: "Home", href: "/exec", phase: 1, exact: true },
  { id: "brief", label: "Brief", href: "/exec/brief", phase: 1 },
  { id: "health", label: "Health", href: "/exec/health", phase: 1 },
  { id: "wisdom", label: "Wisdom", href: "/exec/wisdom", phase: 1 },
  { id: "opportunities", label: "Opportunities", href: "/exec/opportunities", phase: 1 },
  { id: "risks", label: "Risks", href: "/exec/risks", phase: 1 },
  { id: "integrations", label: "Integrations", href: "/exec/integrations", phase: 1 },
  { id: "finance", label: "Finance", href: "/exec/finance", phase: 2 },
  { id: "workforce", label: "Workforce", href: "/exec/workforce", phase: 2 },
  { id: "customers", label: "Customers", href: "/exec/customers", phase: 2 },
  { id: "predictive", label: "Predictive", href: "/exec/predictive", phase: 2 },
  { id: "actions", label: "Actions", href: "/exec/actions", phase: 2 },
  { id: "graph", label: "Graph", href: "/exec/graph", phase: 1 },
  { id: "timeline", label: "Timeline", href: "/exec/timeline", phase: 2 },
  { id: "ask", label: "Ask JAG", href: "/exec/ask", phase: 1 },
];

/** Only ship routes that exist — Phase 2+ items render as non-links in ExecNav. */
export const EXEC_NAV_ENABLED = EXEC_NAV.filter((item) => item.phase === 1);

export function isExecNavActive(pathname: string, item: ExecNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
