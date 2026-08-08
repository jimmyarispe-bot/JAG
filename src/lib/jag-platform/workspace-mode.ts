/**
 * Phase 65 — Platform/admin vs customer Executive Intelligence workspace mode.
 *
 * Platform authority alone must not force platform/admin navigation while the
 * user is operating inside a customer organization.
 */

import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type JagWorkspaceMode = "customer" | "platform";

export const JAG_WORKSPACE_QUERY_PARAM = "workspace" as const;

/**
 * Resolve workspace composition mode from URL + session + active org.
 *
 * - Explicit `?workspace=platform` → platform/admin (stewards only)
 * - Active customer organization (and not explicit platform) → customer
 * - Otherwise platform stewards → platform; org operators without org → customer fail-closed
 */
export function resolveJagWorkspaceMode(input: {
  readonly session: JagPlatformSession;
  readonly activeOrganizationId: string | null;
  readonly workspaceParam?: string | null;
}): JagWorkspaceMode {
  const explicit = input.workspaceParam?.trim().toLowerCase() ?? "";
  if (explicit === "platform" || explicit === "admin") {
    if (input.session.authority === "platform") return "platform";
    // Org operators cannot enter platform/admin composition.
    return "customer";
  }

  if (input.activeOrganizationId) return "customer";

  if (input.session.authority === "platform") return "platform";

  return "customer";
}

export function platformAdminHref(): string {
  return `/jag?${JAG_WORKSPACE_QUERY_PARAM}=platform`;
}

export function customerWorkspaceHref(organizationId: string): string {
  return `/jag?org=${encodeURIComponent(organizationId)}`;
}
