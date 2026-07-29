/**
 * Executive Command Center navigation — UI catalog only.
 */

export type JagNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

export const JAG_COMMAND_NAV: readonly JagNavItem[] = [
  { id: "overview", label: "Overview", href: "/jag" },
  {
    id: "chat",
    label: "Conversation",
    href: "/jag/chat",
  },
  {
    id: "decisions",
    label: "Decision Center",
    href: "/jag/decisions",
  },
  {
    id: "briefings",
    label: "Executive Briefings",
    href: "/jag/briefings",
  },
  {
    id: "scenarios",
    label: "Scenario Planner",
    href: "/jag/scenarios",
  },
  {
    id: "organizations",
    label: "Organizations",
    href: "/jag/organizations",
  },
  { id: "domains", label: "Domains", href: "/jag/domains" },
  {
    id: "capability-packs",
    label: "Capability Packs",
    href: "/jag/capability-packs",
  },
  { id: "knowledge", label: "Knowledge", href: "/jag/knowledge" },
  { id: "policies", label: "Policies", href: "/jag/policies" },
  {
    id: "intelligence-graph",
    label: "Intelligence Graph",
    href: "/jag/intelligence-graph",
  },
  {
    id: "observability",
    label: "Observability",
    href: "/jag/observability",
  },
  { id: "runtime", label: "Runtime", href: "/jag/runtime" },
  { id: "settings", label: "Settings", href: "/jag/settings" },
] as const;

export function isJagNavActive(pathname: string, href: string): boolean {
  if (href === "/jag") {
    return pathname === "/jag" || pathname === "/jag/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
