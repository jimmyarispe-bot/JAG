/**
 * JAG Platform navigation — platform modules only (not AcademyOS).
 */

import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import { canViewPlatformHealth } from "@/lib/jag-platform/admin-access";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type JagPlatformNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  /** When true, only platform admin roles see the item. */
  readonly adminOnly?: boolean;
};

export const JAG_PLATFORM_NAV: readonly JagPlatformNavItem[] = Object.freeze([
  { id: "dashboard", label: "Dashboard", href: "/jag/dashboard" },
  { id: "organizations", label: "Organizations", href: "/jag/organizations" },
  {
    id: "evidence",
    label: "Evidence Center™",
    href: "/jag/evidence",
  },
  {
    id: "connectors",
    label: "Connectors™",
    href: "/jag/connectors",
  },
  {
    id: "orchestrator",
    label: "Connector Orchestrator™",
    href: "/jag/connectors/orchestrator",
  },
  {
    id: "health",
    label: "Platform Health",
    href: "/jag/health",
    adminOnly: true,
  },
  {
    id: "executive",
    label: "Executive Intelligence™",
    href: "/jag/executive",
  },
  {
    id: "decisions",
    label: "Decision Center™",
    href: "/jag/decisions",
  },
  {
    id: "goals",
    label: "Goals & Strategy™",
    href: "/jag/goals",
  },
  {
    id: "risk",
    label: "Risk & Compliance™",
    href: "/jag/risk",
  },
  {
    id: "work",
    label: "Work & Execution™",
    href: "/jag/work",
  },
  {
    id: "memory",
    label: "Organizational Memory™",
    href: "/jag/memory",
  },
  {
    id: "twin",
    label: "Digital Twin™",
    href: "/jag/twin",
  },
  {
    id: "developer",
    label: "Developer Portal",
    href: "/jag/developer",
  },
  { id: "marketplace", label: "Marketplace", href: "/jag/marketplace" },
  { id: "blueprints", label: "Blueprints", href: "/jag/blueprints" },
  {
    id: "capabilities",
    label: "Capability Packs",
    href: "/jag/capabilities",
  },
  { id: "providers", label: "Providers", href: "/jag/providers" },
  { id: "governance", label: "Governance", href: "/jag/governance" },
  { id: "settings", label: "Settings", href: "/jag/settings" },
]);

/** Labels that belong to AcademyOS and must never appear in JAG nav. */
export const ACADEMYOS_NAV_FORBIDDEN_LABELS = Object.freeze([
  "Admissions",
  "Students",
  "Classes",
  "Parents",
  "Teachers",
] as const);

export function jagNavContainsAcademyOsItems(
  items: readonly JagPlatformNavItem[] = JAG_PLATFORM_NAV
): boolean {
  const labels = new Set(items.map((i) => i.label.toLowerCase()));
  return ACADEMYOS_NAV_FORBIDDEN_LABELS.some((label) =>
    labels.has(label.toLowerCase())
  );
}

export function listJagPlatformNavForSession(
  session: JagPlatformSession | null | undefined
): readonly JagPlatformNavItem[] {
  const canAdmin = session ? canViewPlatformHealth(session) : false;
  return Object.freeze(
    JAG_PLATFORM_NAV.filter((item) => !item.adminOnly || canAdmin)
  );
}

export function isAdminOnlyNavRole(role: JagPlatformRole): boolean {
  return canViewPlatformHealth({
    userId: "",
    email: "",
    displayName: "",
    role,
    authority: "platform",
    organizationId: null,
    issuedAt: "",
  });
}
