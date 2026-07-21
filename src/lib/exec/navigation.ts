/**
 * Executive Command Center primary navigation.
 * Only ship routes that exist and are production-ready.
 */

export type ExecNavItem = {
  id: string;
  label: string;
  href: string;
  /** Reserved for staged rollout; only `1` items appear in the nav. */
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
  { id: "ask", label: "Ask JAG", href: "/exec/ask", phase: 1 },
];

/** Only ship routes that exist and are production-ready. */
export const EXEC_NAV_ENABLED = EXEC_NAV.filter((item) => item.phase === 1);

export function isExecNavActive(pathname: string, item: ExecNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
