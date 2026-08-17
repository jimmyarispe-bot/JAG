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
 * - Explicit `?org=<id>` → customer (stewards may always enter a customer workspace)
 * - Otherwise platform stewards → platform/admin (their home surface)
 * - Org operators → customer, with or without a bound org (fail-closed)
 *
 * Note: a steward's *bound* organization no longer forces customer composition.
 * Only an explicitly selected organization does. Stewards land on platform/admin
 * by default and opt in to a customer workspace via the organization selector.
 */
export function resolveJagWorkspaceMode(input: {
  readonly session: JagPlatformSession;
  readonly activeOrganizationId: string | null;
  readonly workspaceParam?: string | null;
  /**
   * The organization the caller explicitly asked for (`?org=<id>`).
   * Distinct from {@link activeOrganizationId}, which may be a bound or
   * soft-picked default the user never chose.
   */
  readonly explicitOrganizationParam?: string | null;
}): JagWorkspaceMode {
  const explicit = input.workspaceParam?.trim().toLowerCase() ?? "";
  if (explicit === "platform" || explicit === "admin") {
    if (input.session.authority === "platform") return "platform";
    // Org operators cannot enter platform/admin composition.
    return "customer";
  }

  // An explicitly selected organization always wins — including for stewards.
  if (input.explicitOrganizationParam?.trim()) return "customer";

  if (input.session.authority === "platform") return "platform";

  if (input.activeOrganizationId) return "customer";

  return "customer";
}

export function platformAdminHref(): string {
  return `/jag?${JAG_WORKSPACE_QUERY_PARAM}=platform`;
}

export function customerWorkspaceHref(organizationId: string): string {
  return `/jag?org=${encodeURIComponent(organizationId)}`;
}
